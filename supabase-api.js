/* AgriRenta <-> Supabase bridge.
   app.js still calls "/api/..." exactly like before. This file answers those calls using
   Supabase Auth (login, register, password) and the "api" Edge Function (app data),
   so the design, layout and app logic stay the same. */
(function () {
  "use strict";
  const cfg = window.AGRIRENTA_SUPABASE || {};
  const ready = window.supabase && cfg.url && cfg.key && !/^YOUR_/.test(cfg.url) && !/^YOUR_/.test(cfg.key);
  if (!ready) {
    console.warn("AgriRenta: Supabase is not configured. Fill in supabase-config.js (see README.md). Running in local-only mode.");
    return;
  }

  const nativeFetch = window.fetch.bind(window);
  const sb = window.supabase.createClient(cfg.url, cfg.key, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "agrirenta-auth", flowType: "pkce" }
  });
  const FUNCTION_URL = cfg.url.replace(/\/+$/, "") + "/functions/v1/api";

  const reply = (status, body) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  });

  async function callFunction(method, path, body) {
    const { data } = await sb.auth.getSession();
    const token = data && data.session ? data.session.access_token : cfg.key;
    return nativeFetch(FUNCTION_URL + path, {
      method,
      headers: { "Content-Type": "application/json", apikey: cfg.key, Authorization: "Bearer " + token },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }

  const passthrough = (method, path) => (body) => callFunction(method, path, body);

  const routes = {
    "GET /api/state": passthrough("GET", "/state"),
    "PUT /api/state": passthrough("PUT", "/state"),
    "POST /api/bootstrap": passthrough("POST", "/bootstrap"),
    "PUT /api/profile": async (body) => {
      const response = await callFunction("PUT", "/profile", body);
      if (response.ok) await sb.auth.refreshSession().catch(() => {});
      return response;
    },
    "POST /api/role": passthrough("POST", "/role"),
    "POST /api/admin/verification": passthrough("POST", "/admin/verification"),
    "POST /api/payment/gcash-demo-complete": passthrough("POST", "/payment/gcash-demo-complete"),

    "POST /api/login": async (body) => {
      const email = String(body.email || "").trim().toLowerCase();
      const { error } = await sb.auth.signInWithPassword({ email, password: String(body.password || "") });
      if (error) {
        const limited = /rate|too many/i.test(error.message || "");
        return reply(limited ? 429 : 401, { ok: false, error: limited ? "Too many login attempts. Please wait a few minutes and try again." : "Wrong email or password." });
      }
      const response = await callFunction("POST", "/login-check", { code: body.code });
      const result = await response.clone().json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        await sb.auth.signOut({ scope: "local" }).catch(() => {});
        return reply(response.status || 401, { ok: false, error: result.error || "Login failed." });
      }
      return reply(200, result);
    },

    "POST /api/register": async (body) => {
      const response = await callFunction("POST", "/register", body);
      const result = await response.clone().json().catch(() => ({}));
      if (!response.ok || !result.ok) return response;
      const { error } = await sb.auth.signInWithPassword({ email: String(body.email).trim().toLowerCase(), password: String(body.password) });
      if (error) return reply(500, { ok: false, error: "Account created, but sign-in failed. Please log in." });
      return response;
    },

    "POST /api/password": async (body) => {
      const newPassword = String(body.newPassword || "");
      if (newPassword.length < 8) return reply(400, { ok: false, error: "New password must be at least 8 characters." });
      const { data } = await sb.auth.getSession();
      if (!data || !data.session) return reply(401, { ok: false, error: "Please log in to continue." });
      const check = await sb.auth.signInWithPassword({ email: data.session.user.email, password: String(body.currentPassword || "") });
      if (check.error) return reply(401, { ok: false, error: "Current password is incorrect." });
      const update = await sb.auth.updateUser({ password: newPassword });
      if (update.error) return reply(400, { ok: false, error: update.error.message || "Could not update the password." });
      return reply(200, { ok: true });
    },

    "POST /api/logout": async () => {
      await sb.auth.signOut({ scope: "local" }).catch(() => {});
      return reply(200, { ok: true });
    }
  };

  // "Continue with Google": Supabase sends the user to Google, then back to this page, already signed in.
  window.agrirentaGoogleLogin = async function () {
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) throw error;
  };

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (!url.startsWith("/api/")) return nativeFetch(input, init);
    const options = init || {};
    const method = String(options.method || "GET").toUpperCase();
    const route = routes[method + " " + url.split("?")[0]];
    if (!route) return reply(404, { ok: false, error: "Unknown API route." });
    let body;
    try { body = options.body ? JSON.parse(options.body) : undefined; }
    catch (error) { return reply(400, { ok: false, error: "Request body must be valid JSON." }); }
    return route(body);
  };
})();
