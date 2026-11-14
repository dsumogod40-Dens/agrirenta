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
  const PUBLIC_ASSET_BUCKET = "agrirenta-public";
  const privateUrlCache = new Map();

  const reply = (status, body) => new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  });
  const passwordValidationError = (password) => {
    const missing = [];
    if (password.length < 8) missing.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) missing.push("an uppercase letter");
    if (!/[a-z]/.test(password)) missing.push("a lowercase letter");
    if (!/[0-9]/.test(password)) missing.push("a number");
    if (!/[^A-Za-z0-9]/.test(password)) missing.push("a special character");
    return missing.length ? `Password must include ${missing.join(", ")}.` : null;
  };

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

  window.agrirentaStorage = {
    publicUrl(reference) {
      const match = /^storage:\/\/public\/(.+)$/.exec(String(reference || ""));
      return match ? sb.storage.from(PUBLIC_ASSET_BUCKET).getPublicUrl(match[1]).data.publicUrl : reference;
    },
    async upload(file, kind) {
      if (!file || !file.type || !Number.isSafeInteger(file.size) || file.size < 1) {
        throw new Error("The selected file is empty or has no supported file type.");
      }
      const response = await callFunction("POST", "/storage/upload-url", {
        kind,
        contentType:file.type,
        size:file.size,
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not prepare secure file storage.");
      const { error } = await sb.storage.from(result.bucket).uploadToSignedUrl(
        result.path, result.token, file, { contentType:file.type, upsert:false }
      );
      if (error) throw new Error(error.message || "Could not upload the selected file to secure storage.");
      return { reference:result.reference };
    },
    async privateUrls(references) {
      const urls = new Map();
      const missing = [...new Set(references)].filter((reference) => {
        const cached = privateUrlCache.get(reference);
        if (cached && cached.expiresAt > Date.now()) {
          urls.set(reference, cached.url);
          return false;
        }
        return true;
      });
      for (let index = 0; index < missing.length; index += 100) {
        const batch = missing.slice(index, index + 100);
        const response = await callFunction("POST", "/storage/private-urls", { references:batch });
        const result = await response.json();
        if (!response.ok || !result.ok || !Array.isArray(result.urls)) {
          throw new Error(result.error || "Could not securely load these documents.");
        }
        for (const item of result.urls) {
          if (typeof item.reference !== "string" || typeof item.url !== "string") continue;
          urls.set(item.reference, item.url);
          privateUrlCache.set(item.reference, { url:item.url, expiresAt:Date.now() + 780000 });
        }
      }
      return urls;
    },
    async privateUrl(reference) {
      const urls = await this.privateUrls([reference]);
      const url = urls.get(reference);
      if (!url) throw new Error("Could not securely load this document.");
      return url;
    },
  };

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
    "POST /api/admin/migrate-media": passthrough("POST", "/admin/migrate-media"),
    "POST /api/payment/gcash-demo-complete": passthrough("POST", "/payment/gcash-demo-complete"),
    "POST /api/commission/payment": passthrough("POST", "/commission/payment"),
    "POST /api/commission/demo-payment": passthrough("POST", "/commission/demo-payment"),
    "POST /api/commission/archive": passthrough("POST", "/commission/archive"),
    "POST /api/commission/payment-review": passthrough("POST", "/commission/payment-review"),
    "POST /api/commission/dispute": passthrough("POST", "/commission/dispute"),
    "POST /api/commission/dispute-review": passthrough("POST", "/commission/dispute-review"),
    "POST /api/commission/settings": passthrough("POST", "/commission/settings"),

    "POST /api/login": async (body) => {
      privateUrlCache.clear();
      const email = String(body.email || "").trim().toLowerCase();
      const { error } = await sb.auth.signInWithPassword({ email, password: String(body.password || "") });
      if (error) {
        if (/email not confirmed|email.*confirm/i.test(error.message || "")) {
          return reply(401, { ok: false, error: "Please verify your email address using the code we sent before logging in." });
        }
        const limited = /rate|too many/i.test(error.message || "");
        return reply(limited ? 429 : 401, { ok: false, error: limited ? "Too many login attempts. Please wait a few minutes and try again." : "Wrong email or password." });
      }
      const response = await callFunction("POST", "/login-check");
      const result = await response.clone().json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        await sb.auth.signOut({ scope: "local" }).catch(() => {});
        return reply(response.status || 401, { ok: false, error: result.error || "Login failed." });
      }
      return reply(200, result);
    },

    "POST /api/register": async (body) => {
      privateUrlCache.clear();
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      const role = String(body.role || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !phone || !["customer", "owner"].includes(role)) {
        return reply(400, { ok: false, error: "Enter a valid name, email, phone number, and account type." });
      }
      const passwordError = passwordValidationError(String(body.password || ""));
      if (passwordError) return reply(400, { ok: false, error: passwordError });
      const { error } = await sb.auth.signUp({
        email,
        password: String(body.password),
        options: { data: { name, phone, role } },
      });
      if (error) {
        const duplicate = /already|registered|exists/i.test(error.message || "");
        return reply(duplicate ? 409 : 400, { ok: false, error: duplicate ? "That email is already registered." : error.message });
      }
      return reply(201, { ok: true, email, verificationRequired: true });
    },

    "POST /api/verify-email": async (body) => {
      const email = String(body.email || "").trim().toLowerCase();
      const token = String(body.token || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6,8}$/.test(token)) {
        return reply(400, { ok: false, error: "Enter the verification code sent to your email address (6 to 8 digits)." });
      }
      const { data, error } = await sb.auth.verifyOtp({ email, token, type: "signup" });
      let verifiedUser = data && data.user;
      if (error) {
        const { data: current } = await sb.auth.getUser();
        verifiedUser = current && current.user;
        if (!verifiedUser || String(verifiedUser.email || "").toLowerCase() !== email || !verifiedUser.email_confirmed_at) {
          return reply(400, { ok: false, error: error.message || "That verification code is invalid or expired. Request a new code and try again." });
        }
      }
      if (!verifiedUser || String(verifiedUser.email || "").toLowerCase() !== email || !verifiedUser.email_confirmed_at) {
        return reply(401, { ok: false, error: "Email verification was not completed. Request a new code and try again." });
      }
      const registration = await callFunction("POST", "/register");
      const registrationResult = await registration.clone().json().catch(() => ({}));
      if (!registration.ok || !registrationResult.ok) return registration;
      const { error: refreshError } = await sb.auth.refreshSession();
      if (refreshError) return reply(500, { ok: false, error: "Email verified, but your session could not be refreshed. Please log in." });
      const response = await callFunction("POST", "/login-check");
      const result = await response.clone().json().catch(() => ({}));
      if (!response.ok || !result.ok) return response;
      return reply(200, result);
    },

    "POST /api/resend-verification": async (body) => {
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply(400, { ok: false, error: "Enter a valid email address." });
      }
      const { error } = await sb.auth.resend({ type: "signup", email });
      if (error) return reply(400, { ok: false, error: error.message || "Could not resend the verification code." });
      return reply(200, { ok: true });
    },

    "POST /api/password": async (body) => {
      const newPassword = String(body.newPassword || "");
      const passwordError = passwordValidationError(newPassword);
      if (passwordError) return reply(400, { ok: false, error: passwordError });
      return callFunction("POST", "/password", body);
    },

    "POST /api/logout": async () => {
      await sb.auth.signOut({ scope: "local" }).catch(() => {});
      privateUrlCache.clear();
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
