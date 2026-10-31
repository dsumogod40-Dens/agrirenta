// @ts-nocheck
// AgriRenta API — Supabase Edge Function (name: "api").
// Same business rules as the old backend/server.js (Node + MySQL), now running on Supabase.
// Passwords and sessions are handled by Supabase Auth; app data lives in the table public.app_state.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Optional secrets (Edge Functions > Secrets). Defaults match the old demo setup.
const ADMIN_2FA_CODE = Deno.env.get("ADMIN_2FA_CODE") || "123456";
const DEMO_PASSWORD = Deno.env.get("DEMO_PASSWORD") || "demo1234";
// Only these demo accounts are created automatically on the first visit (bootstrap).
const DEMO_ACCOUNTS = {
  "alex.santos@example.com": "customer",
  "maria@example.com": "customer",
  "pedro@example.com": "customer",
  "juan@example.com": "owner",
  "ops@agrirenta.example": "admin",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function send(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function sendError(status, message) { return send(status, { ok: false, error: message }); }

function tokenUsedOAuth(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Array.isArray(payload.amr) && payload.amr.some((item) => item?.method === "oauth");
  } catch { return false; }
}

// First Google sign-in: the account has no role yet, so make it a customer and add its profile to the app data.
async function createGoogleCustomer(authUser) {
  const email = String(authUser.email).toLowerCase();
  const meta = authUser.user_metadata || {};
  const name = String(meta.full_name || meta.name || email.split("@")[0]).trim();
  const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
    app_metadata: { ...(authUser.app_metadata || {}), role: "customer", role_pending: true },
  });
  if (error) throw error;
  const addProfile = (state) => {
    state.users = Array.isArray(state.users) ? state.users : [];
    if (!state.users.some((item) => item.email === email)) {
      state.users.push({ email, name, role: "customer", phone: "", v: { email: 1 } });
    }
    return state;
  };
  if (await loadRow()) await updateState((state) => addProfile(state));
  return { id: authUser.id, email, role: "customer", rolePending: true, appMeta: { ...(authUser.app_metadata || {}), role: "customer", role_pending: true } };
}

async function currentUser(req) {
  const header = req.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.email) return null;
  const authUser = data.user;
  const role = authUser.app_metadata?.role;
  if (!role) {
    // Only Google accounts get an automatic role. Email sign-ups made directly against Supabase stay unusable.
    if (authUser.app_metadata?.provider === "google" && authUser.email_confirmed_at) return await createGoogleCustomer(authUser);
    return null;
  }
  if (!["customer", "owner", "admin"].includes(role)) return null;
  // Admins must use email + password + 2FA code. A Google session can never act as admin.
  if (role === "admin" && tokenUsedOAuth(token)) return null;
  return {
    id: authUser.id, email: String(authUser.email).toLowerCase(), role,
    rolePending: authUser.app_metadata?.role_pending === true, appMeta: authUser.app_metadata || {},
  };
}
function requireUser(user) {
  if (!user) throw new HttpError(401, "Please log in to continue.");
  return user;
}
function requireAdminUser(user) {
  requireUser(user);
  if (user.role !== "admin") throw new HttpError(403, "Administrator access is required.");
  return user;
}

async function loadRow() {
  const { data, error } = await supabase.from("app_state").select("state, rev").eq("state_key", "main").maybeSingle();
  if (error) throw error;
  return data || null;
}
async function getState() {
  const row = await loadRow();
  if (!row) return null;
  if (!row.state || typeof row.state !== "object" || Array.isArray(row.state)) throw new Error("Saved application state is invalid.");
  return row.state;
}

// Read-modify-write with a revision check so two people saving at once cannot overwrite each other.
// mutator(copyOfSavedState, savedState) returns the new state (it may throw HttpError).
async function updateState(mutator, { unconditional = false } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await loadRow();
    if (!row) throw new HttpError(409, "Application data has not been initialized.");
    const next = await mutator(structuredClone(row.state), row.state);
    let query = supabase.from("app_state")
      .update({ state: next, rev: Number(row.rev) + 1, updated_at: new Date().toISOString() })
      .eq("state_key", "main");
    if (!unconditional) query = query.eq("rev", row.rev);
    const { data, error } = await query.select("rev");
    if (error) throw error;
    if (data && data.length) return next;
  }
  throw new HttpError(409, "Another change was saved at the same time. Please try again.");
}

function stripSecrets(state) {
  const copy = structuredClone(state);
  copy.me = null;
  for (const user of copy.users || []) delete user.pw;
  return copy;
}

// ---------------------------------------------------------------------------
// Business rules (unchanged from the old Node backend)
// ---------------------------------------------------------------------------
function publicState(state, user) {
  const copy = structuredClone(state);
  copy.me = user ? user.email : null;
  copy.notificationReads = copy.notificationReads && typeof copy.notificationReads === "object" ? copy.notificationReads : {};
  copy.commissionWithdrawals = Array.isArray(copy.commissionWithdrawals) ? copy.commissionWithdrawals : [];
  for (const record of copy.users || []) {
    delete record.pw;
    if (record.email !== user?.email && user?.role !== "admin") {
      delete record.idDocs;
      delete record.phone;
      delete record.address;
    }
  }
  if (user?.role !== "admin") {
    copy.eq = (copy.eq || []).filter((item) => ((!item.status || item.status === "approved") && item.visible !== false) || item.owner === user?.email);
    for (const item of copy.eq) {
      if (item.owner !== user?.email) {
        delete item.photos;
        delete item.orcr;
        delete item.permit;
        delete item.unavailableDates;
      }
    }
    copy.bookings = (copy.bookings || []).map((booking) => {
      if (booking.renter === user?.email || booking.owner === user?.email) return booking;
      return { eq: booking.eq, start: booking.start, end: booking.end, status: booking.status };
    });
    copy.messages = (copy.messages || []).filter((message) => {
      const thread = String(message.thread || message.from || "");
      if (user?.role === "admin") return !thread.startsWith("direct:");
      return thread === user?.email || (thread.startsWith("direct:") && thread.slice(7).split("|").includes(user?.email));
    });
    copy.withdrawals = (copy.withdrawals || []).filter((withdrawal) => withdrawal.owner === user?.email);
    copy.commissionWithdrawals = [];
    copy.notificationReads = user && Array.isArray(copy.notificationReads[user.email])
      ? { [user.email]: copy.notificationReads[user.email] }
      : {};
    copy.favorites = user && copy.favorites?.[user.email] ? { [user.email]: copy.favorites[user.email] } : {};
    copy.reviews = (copy.reviews || []).filter((review) => review.type !== "admin");
  } else {
    copy.messages = (copy.messages || []).filter((message) => !String(message.thread || message.from || "").startsWith("direct:"));
  }
  return copy;
}

function mergeMemberState(current, incoming, user) {
  const merged = structuredClone(current);
  const email = user.email;
  merged.notificationReads = merged.notificationReads && typeof merged.notificationReads === "object" ? merged.notificationReads : {};
  merged.commissionWithdrawals = Array.isArray(merged.commissionWithdrawals) ? merged.commissionWithdrawals : [];
  const oldUser = merged.users.find((item) => item.email === email);
  const newUser = incoming.users.find((item) => item.email === email);
  if (oldUser && newUser) {
    for (const field of ["name", "phone", "address", "avatar"]) {
      if (Object.hasOwn(newUser, field)) oldUser[field] = newUser[field];
      else delete oldUser[field];
    }
    oldUser.v = oldUser.v && typeof oldUser.v === "object" ? oldUser.v : {};
    if (newUser.v?.mobile === 1) oldUser.v.mobile = 1;
    if (newUser.v?.email === 1) oldUser.v.email = 1;
    if (newUser.idDocs && newUser.v?.id === "review" && newUser.v?.selfie === "review") {
      oldUser.idDocs = structuredClone(newUser.idDocs);
      oldUser.v.id = "review";
      oldUser.v.selfie = "review";
    }
    if (user.role === "owner" && newUser.v?.papers === "review"
      && incoming.eq.some((item) => item.owner === email && item.status === "review")) {
      oldUser.v.papers = "review";
    }
  }

  merged.favorites = merged.favorites || {};
  if (incoming.favorites?.[email]) merged.favorites[email] = incoming.favorites[email];
  else delete merged.favorites[email];
  if (Array.isArray(incoming.notificationReads?.[email])) {
    merged.notificationReads[email] = [...new Set(incoming.notificationReads[email].filter((id) => typeof id === "string"))].slice(-5000);
  }

  if (user.role === "owner") {
    for (const item of incoming.eq) {
      const existing = merged.eq.find((record) => String(record.id) === String(item.id));
      if (!existing && item.owner === email && item.status === "review") merged.eq.push(item);
      else if (existing?.owner === email && item.owner === email
        && (existing.status === item.status || (item.status === "review" && (!existing.status || ["approved", "rejected"].includes(existing.status))))) {
        Object.assign(existing, item);
      }
    }
    for (const item of incoming.availability) {
      if (item.owner !== email) continue;
      const index = merged.availability.findIndex((record) => String(record.id) === String(item.id));
      if (index < 0) merged.availability.push(item);
      else merged.availability[index] = item;
    }
    merged.availability = merged.availability.filter((item) =>
      item.owner !== email || incoming.availability.some((record) => String(record.id) === String(item.id))
    );
  }

  const incomingBookings = incoming.bookings || [];
  for (let index = merged.bookings.length - 1; index >= 0; index--) {
    const existing = merged.bookings[index];
    const updated = incomingBookings.find((booking) => booking.ref === existing.ref);
    if (user.role === "customer" && existing.renter === email && !updated && existing.status === "pending") {
      merged.bookings.splice(index, 1);
      continue;
    }
    if (!updated) continue;
    if (user.role === "owner" && existing.owner === email) {
      if (existing.status === "pending" && ["approved", "declined"].includes(updated.status)) existing.status = updated.status;
      else if (existing.status === "approved" && updated.status === "returned") existing.status = "returned";
      if (existing.pay === "Cash on Delivery (COD)" && updated.paymentStatus === "paid" && existing.paymentStatus !== "paid") {
        existing.paymentStatus = "paid";
        existing.paymentVerifiedAt = new Date().toISOString();
        existing.paymentVerifiedBy = email;
      }
      if (updated.ratedRenter === true) existing.ratedRenter = true;
    }
    if (user.role === "customer" && existing.renter === email && updated.ratedOwner === true) existing.ratedOwner = true;
  }
  if (user.role === "customer") {
    for (const booking of incomingBookings) {
      if (!merged.bookings.some((record) => record.ref === booking.ref)
        && booking.renter === email && booking.status === "pending"
        && booking.eq != null && booking.start && booking.end && Number(booking.total) > 0) {
        const equipment = merged.eq.find((item) => String(item.id) === String(booking.eq) && (!item.status || item.status === "approved") && item.visible !== false);
        if (equipment) merged.bookings.push(booking);
      }
    }
  }

  for (const review of incoming.reviews || []) {
    if (review.from !== email) continue;
    const existingIndex = merged.reviews.findIndex((item) =>
      item.from === email && item.to === review.to
      && (review.type === "admin" ? item.type === "admin" : item.type !== "admin" && item.bookingRef === review.bookingRef)
    );
    if (existingIndex < 0) merged.reviews.push(review);
    else merged.reviews[existingIndex] = review;
  }

  for (const message of incoming.messages || []) {
    if (message.author !== email || merged.messages.some((item) => item.id === message.id)) continue;
    const thread = String(message.thread || "");
    const participants = thread.startsWith("direct:") ? thread.slice(7).split("|") : [];
    const permitted = thread === email
      || (participants.length === 2 && participants.includes(email)
        && participants.every((participant) => merged.users.some((record) => record.email === participant && record.role !== "admin")));
    if (permitted) merged.messages.push(message);
  }

  if (user.role === "owner") {
    for (const withdrawal of incoming.withdrawals || []) {
      if (withdrawal.owner === email && withdrawal.status === "pending"
        && !merged.withdrawals.some((record) => record.id === withdrawal.id)) merged.withdrawals.push(withdrawal);
    }
  }
  return merged;
}

function memberStateError(current, incoming, user) {
  const email = user.email;
  const bookings = current.bookings || [];
  const requestedBookings = incoming.bookings || [];
  const savedUser = (current.users || []).find((item) => item.email === email);
  const submittedUser = (incoming.users || []).find((item) => item.email === email);
  if (submittedUser?.idDocs && JSON.stringify(submittedUser.idDocs) !== JSON.stringify(savedUser?.idDocs)) {
    const docs = submittedUser.idDocs;
    const validImage = (value) => typeof value === "string" && /^data:image\/(?:jpeg|png|webp);base64,/i.test(value);
    if (submittedUser.v?.id !== "review" || submittedUser.v?.selfie !== "review"
      || !validImage(docs.front) || !validImage(docs.back) || !validImage(docs.selfie)
      || typeof docs.submittedAt !== "string") return "Identity document submission is invalid. Please upload the ID front, back, and selfie again.";
  }
  if (user.role === "customer") {
    for (const booking of requestedBookings.filter((item) => item.ref && !bookings.some((old) => old.ref === item.ref))) {
      const equipment = current.eq.find((item) => String(item.id) === String(booking.eq) && (!item.status || item.status === "approved") && item.visible !== false);
      const start = Date.parse(`${booking.start}T00:00:00Z`);
      const end = Date.parse(`${booking.end}T00:00:00Z`);
      const days = (end - start) / 86400000;
      if (!equipment || booking.renter !== email || booking.owner !== equipment.owner || booking.status !== "pending"
        || !["GCash", "Cash on Delivery (COD)"].includes(booking.pay)
        || !Number.isInteger(days) || days < 1 || !Number.isFinite(Number(booking.total))
        || Number(booking.total) !== Number(equipment.price) * days) return "Booking details are invalid.";
      const overlap = bookings.some((old) => Number(old.eq) === Number(booking.eq)
        && ["pending", "approved"].includes(old.status) && booking.start < old.end && booking.end > old.start);
      const blocked = (current.availability || []).some((period) => Number(period.eq) === Number(booking.eq)
        && booking.start <= period.end && booking.end > period.start);
      if (overlap || blocked) return "Those dates are unavailable. Please choose another date range.";
    }
  }
  if (user.role === "owner") {
    const savedEquipment = new Map((current.eq || []).filter((item) => item.owner === email).map((item) => [String(item.id), item]));
    for (const item of incoming.eq || []) {
      const existing = savedEquipment.get(String(item.id));
      if (existing && existing.owner === email && item.visible !== undefined && typeof item.visible !== "boolean") {
        return "Listing visibility setting is invalid.";
      }
    }
    const earned = bookings.filter((item) => item.owner === email && item.status === "returned")
      .reduce((sum, item) => sum + Number(item.total || 0) * 0.9, 0);
    const allocated = (current.withdrawals || []).filter((item) => item.owner === email && ["pending", "approved", "paid"].includes(item.status))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    for (const withdrawal of incoming.withdrawals || []) {
      if ((current.withdrawals || []).some((item) => item.id === withdrawal.id)) continue;
      if (withdrawal.owner !== email || withdrawal.status !== "pending" || Number(withdrawal.amount) < 100
        || Number(withdrawal.amount) > earned - allocated + 0.001
        || !["GCash", "Maya", "PayPal"].includes(withdrawal.method)
        || !String(withdrawal.accountName || "").trim() || !String(withdrawal.accountRef || "").trim()) {
        return "Cash-out request is invalid or exceeds your available balance.";
      }
    }
  }
  const oldMessages = new Set((current.messages || []).map((item) => item.id));
  for (const message of incoming.messages || []) {
    if (oldMessages.has(message.id) || message.author !== email) continue;
    if (!String(message.text || "").trim() || String(message.text).length > 2000) return "Message must be between 1 and 2000 characters.";
  }
  return null;
}

function isSampleAccountProfile(user) {
  return user?.sampleAccount === true
    && /^(?:owner|customer)\.demo0[1-8]@example\.com$/i.test(String(user.email || ""))
    && ["customer", "owner"].includes(user.role)
    && !user.pw;
}

function isValidState(state) {
  return state && typeof state === "object" && !Array.isArray(state)
    && Array.isArray(state.users) && Array.isArray(state.eq)
    && Array.isArray(state.bookings) && Array.isArray(state.reviews)
    && Array.isArray(state.messages) && Array.isArray(state.withdrawals)
    && Array.isArray(state.availability)
    && (state.commissionWithdrawals === undefined || Array.isArray(state.commissionWithdrawals))
    && (state.notificationReads === undefined || (state.notificationReads && typeof state.notificationReads === "object" && !Array.isArray(state.notificationReads)));
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------
async function handleBootstrap(req) {
  const body = await req.json().catch(() => null);
  if (!isValidState(body?.state)) throw new HttpError(400, "Initial application data is invalid.");
  const state = stripSecrets(body.state);
  const { error } = await supabase.from("app_state").insert({ state_key: "main", state, rev: 1 });
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "Application data is already initialized.");
    throw error;
  }
  for (const user of body.state.users) {
    const email = String(user.email || "").trim().toLowerCase();
    const role = DEMO_ACCOUNTS[email];
    if (!role) continue;
    const { error: createError } = await supabase.auth.admin.createUser({
      email, password: DEMO_PASSWORD, email_confirm: true, app_metadata: { role }, user_metadata: { name: user.name || "" },
    });
    if (createError && !/already|registered|exists/i.test(createError.message)) throw createError;
  }
  return send(200, { ok: true, state: publicState(state, null) });
}

async function handleGetState(req) {
  const user = await currentUser(req);
  const state = await getState();
  const result = state ? publicState(state, user) : null;
  if (result && user?.rolePending) result.rolePending = true;
  return send(200, { ok: true, state: result });
}

// First Google sign-in: the person picks Customer or Equipment owner (once).
async function handleRole(req) {
  const user = requireUser(await currentUser(req));
  if (!user.rolePending) throw new HttpError(403, "Your account type is already set.");
  const body = await req.json().catch(() => ({}));
  const role = body?.role;
  if (!["customer", "owner"].includes(role)) throw new HttpError(400, "Pick Customer or Equipment owner.");
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.appMeta, role, role_pending: false },
  });
  if (error) throw error;
  await updateState((state) => {
    const profile = (state.users || []).find((item) => item.email === user.email);
    if (!profile) throw new HttpError(404, "Account profile was not found.");
    profile.role = role;
    return state;
  });
  return send(200, { ok: true, user: { email: user.email, role } });
}

async function handlePutState(req) {
  const user = requireUser(await currentUser(req));
  const body = await req.json().catch(() => null);
  const state = body?.state;
  if (!isValidState(state)) throw new HttpError(400, "Application data is invalid.");
  if (state.me && state.me !== user.email) throw new HttpError(403, "You cannot save another account's session.");
  await updateState((before) => {
    const beforeUsers = new Map((before.users || []).map((item) => [item.email, item.role]));
    const submittedUsers = new Map(state.users.map((item) => [item.email, item]));
    if (submittedUsers.size !== state.users.length) throw new HttpError(403, "Duplicate account records cannot be saved.");
    for (const [email, role] of beforeUsers) {
      if (!submittedUsers.has(email)) throw new HttpError(403, "Account records cannot be removed.");
      if (submittedUsers.get(email).role !== role) throw new HttpError(403, "Accounts and roles can only be changed through approved account actions.");
    }
    for (const item of state.users) {
      if (!beforeUsers.has(item.email) && !isSampleAccountProfile(item)) {
        throw new HttpError(403, "Accounts and roles can only be changed through approved account actions.");
      }
    }
    const validationError = user.role === "admin" ? null : memberStateError(before, state, user);
    if (validationError) throw new HttpError(400, validationError);
    const next = user.role === "admin" ? structuredClone(state) : mergeMemberState(before, state, user);
    return stripSecrets(next);
  }, { unconditional: user.role === "admin" });
  return send(200, { ok: true });
}

async function handleLoginCheck(req) {
  const user = requireUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const code = String(body?.code || "");
  if (user.role === "admin") {
    if (!code) throw new HttpError(401, "Admin 2FA code required.");
    if (code !== ADMIN_2FA_CODE) throw new HttpError(401, "Admin accounts need the configured 2FA code.");
  }
  return send(200, { ok: true, user: { email: user.email, role: user.role } });
}

async function handleRegister(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "").trim();
  const phone = String(body?.phone || "").trim();
  const password = String(body?.password || "");
  const role = body?.role;
  if (!email || !name || !phone || password.length < 8 || !["customer", "owner"].includes(role)) {
    throw new HttpError(400, "Enter a valid name, email, phone number, role, and password of at least 8 characters.");
  }
  const { error: createError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, app_metadata: { role }, user_metadata: { name },
  });
  if (createError) {
    if (/already|registered|exists/i.test(createError.message)) throw new HttpError(409, "That email is already registered.");
    throw new HttpError(400, createError.message);
  }
  const addProfile = (state) => {
    state.users = Array.isArray(state.users) ? state.users : [];
    if (!state.users.some((item) => item.email === email)) state.users.push({ email, name, role, phone, v: { email: 1 } });
    return state;
  };
  const row = await loadRow();
  if (!row) {
    const initial = addProfile({ me: null, eq: [], users: [], bookings: [], reviews: [], withdrawals: [], messages: [], availability: [], favorites: {} });
    const { error } = await supabase.from("app_state").insert({ state_key: "main", state: initial, rev: 1 });
    if (error && error.code !== "23505") throw error;
    if (error) await updateState((state) => addProfile(state));
  } else {
    await updateState((state) => addProfile(state));
  }
  return send(201, { ok: true, user: { email, role, name, phone } });
}

async function handleProfile(req) {
  const user = requireUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const oldEmail = user.email;
  const newEmail = String(body?.email || "").trim().toLowerCase();
  const name = String(body?.name || "").trim();
  const phone = String(body?.phone || "").trim();
  const address = String(body?.address || "").trim();
  if (!newEmail || !name || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    throw new HttpError(400, "Enter a valid name, email address, and phone number.");
  }
  if (newEmail !== oldEmail) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { email: newEmail, email_confirm: true });
    if (error) {
      if (/already|registered|exists|duplicate/i.test(error.message)) throw new HttpError(409, "That email is already used by another account.");
      throw error;
    }
  }
  await updateState((state) => {
    const profile = (state.users || []).find((item) => item.email === oldEmail);
    if (!profile) throw new HttpError(404, "Account profile was not found.");
    profile.email = newEmail;
    profile.name = name;
    profile.phone = phone;
    profile.address = address;
    for (const booking of state.bookings || []) {
      if (booking.renter === oldEmail) booking.renter = newEmail;
      if (booking.owner === oldEmail) booking.owner = newEmail;
    }
    for (const equipment of state.eq || []) if (equipment.owner === oldEmail) equipment.owner = newEmail;
    for (const item of state.availability || []) if (item.owner === oldEmail) item.owner = newEmail;
    for (const item of state.withdrawals || []) if (item.owner === oldEmail) item.owner = newEmail;
    for (const message of state.messages || []) {
      if (message.author === oldEmail) message.author = newEmail;
      if (message.from === oldEmail) message.from = newEmail;
      if (message.thread === oldEmail) message.thread = newEmail;
      if (typeof message.thread === "string" && message.thread.startsWith("direct:")) {
        const participants = message.thread.slice(7).split("|").map((email) => email === oldEmail ? newEmail : email);
        message.thread = `direct:${participants.sort().join("|")}`;
      }
    }
    for (const review of state.reviews || []) {
      if (review.to === oldEmail) review.to = newEmail;
      if (review.from === oldEmail) review.from = newEmail;
    }
    if (state.favorites?.[oldEmail]) {
      state.favorites[newEmail] = state.favorites[oldEmail];
      delete state.favorites[oldEmail];
    }
    return state;
  });
  return send(200, { ok: true, user: { email: newEmail, role: user.role } });
}

async function handleVerification(req) {
  requireAdminUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const kind = String(body?.kind || "");
  const approved = body?.approved === true;
  if (!email || !["ID + selfie", "Equipment papers"].includes(kind)) throw new HttpError(400, "Verification request is invalid.");
  await updateState((state) => {
    const target = (state.users || []).find((item) => item.email === email);
    if (!target) throw new HttpError(404, "User not found.");
    target.v = target.v && typeof target.v === "object" ? target.v : {};
    if (kind === "Equipment papers") target.v.papers = approved ? "ok" : "none";
    else {
      target.v.id = approved ? "ok" : "none";
      target.v.selfie = approved ? "ok" : "none";
    }
    return state;
  }, { unconditional: true });
  return send(200, { ok: true });
}

async function handleGcashDemo(req) {
  const user = requireUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const reference = String(body?.reference || "");
  let status = "";
  await updateState((state) => {
    const booking = (state.bookings || []).find((item) => item.ref === reference && item.renter === user.email);
    if (!booking || booking.pay !== "GCash") throw new HttpError(404, "GCash booking was not found for this account.");
    if (booking.paymentStatus !== "paid") booking.paymentStatus = "demo_completed";
    status = booking.paymentStatus;
    return state;
  }, { unconditional: true });
  return send(200, { ok: true, payment_status: status });
}

const ROUTES = {
  "GET /state": handleGetState,
  "PUT /state": handlePutState,
  "POST /bootstrap": handleBootstrap,
  "POST /login-check": handleLoginCheck,
  "POST /register": handleRegister,
  "POST /role": handleRole,
  "PUT /profile": handleProfile,
  "POST /admin/verification": handleVerification,
  "POST /payment/gcash-demo-complete": handleGcashDemo,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const path = new URL(req.url).pathname.replace(/^\/functions\/v1/, "").replace(/^\/api(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const handler = ROUTES[`${req.method} ${path}`];
  if (!handler) return sendError(404, "Unknown API route.");
  try {
    return await handler(req);
  } catch (error) {
    if (error instanceof HttpError) return sendError(error.status, error.message);
    console.error(`Request failed (${req.method} ${path}):`, error);
    return sendError(500, "Unexpected server error. Check the Edge Function logs in Supabase.");
  }
});
