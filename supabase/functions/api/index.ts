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

// Optional secret (Edge Functions > Secrets). Defaults match the old demo setup.
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
  // A Google session can never act as admin.
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
  for (const user of copy.users || []) {
    delete user.pw;
    delete user.pwHash;
  }
  return copy;
}

const COMMISSION_RATE = 0.1;
const DEFAULT_COMMISSION_GRACE_DAYS = 7;
const OWNER_COMPLETION_GRACE_MS = 24 * 60 * 60 * 1000;
const PUBLIC_ASSET_BUCKET = "agrirenta-public";
const PRIVATE_ASSET_BUCKET = "agrirenta-private";
const PUBLIC_ASSET_MAX_BYTES = 5 * 1024 * 1024;
const PRIVATE_ASSET_MAX_BYTES = 10 * 1024 * 1024;

const ASSET_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function isStorageRef(value, visibility) {
  return typeof value === "string" && value.startsWith(`storage://${visibility}/`);
}

function isOwnedPrivateUploadReference(value, user, kind) {
  const prefix = `storage://private/${user.id}/${kind}/`;
  if (typeof value !== "string" || !value.startsWith(prefix)) return false;
  const path = value.slice(prefix.length);
  return !!path && !path.split("/").some((part) => !part || part === "." || part === "..");
}

function isMigratableDataUrl(value, visibility) {
  if (typeof value !== "string") return false;
  const match = /^data:([^;,]+);base64,/i.exec(value);
  if (!match) return false;
  const mime = match[1].toLowerCase();
  if (visibility === "public") return ["image/jpeg", "image/png", "image/webp"].includes(mime);
  return Object.hasOwn(ASSET_EXTENSIONS, mime);
}

function decodeDataUrl(value) {
  const match = /^data:([^;,]+);base64,([\s\S]*)$/i.exec(value);
  if (!match) throw new HttpError(400, "A stored media file is not a supported base64 data URL.");
  const contentType = match[1].toLowerCase();
  if (!Object.hasOwn(ASSET_EXTENSIONS, contentType)) {
    throw new HttpError(415, "A stored media file has an unsupported file type.");
  }
  const binary = atob(match[2]);
  return {
    contentType,
    bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  };
}

function collectLegacyMedia(state) {
  const candidates = [];
  const add = (target, key, section, recordKey, field, kind, visibility) => {
    const value = target?.[key];
    if (!isMigratableDataUrl(value, visibility)) return;
    candidates.push({
      value,
      section,
      recordKey: String(recordKey),
      field,
      kind,
      visibility,
      owner: section === "users" ? String(recordKey) : String(target.owner || ""),
      replace: (reference) => { target[key] = reference; },
    });
  };

  for (const user of state.users || []) {
    add(user, "avatar", "users", user.email, "avatar", "avatar", "public");
    for (const field of ["front", "back", "selfie"]) {
      add(user.idDocs, field, "users", user.email, `idDocs.${field}`, "identity-document", "private");
    }
  }
  for (const item of state.eq || []) {
    add(item, "img", "eq", item.id, "img", "equipment-photo", "public");
    (item.photos || []).forEach((photo, index) => {
      add(photo, "data", "eq", item.id, `photos.${index}.data`, "equipment-photo", "public");
    });
    for (const field of ["orcr", "permit"]) {
      add(item[field], "data", "eq", item.id, `${field}.data`, "equipment-document", "private");
    }
  }
  return candidates;
}

async function legacyMediaPath(candidate, contentType, bytes) {
  const contentDigest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const contentHash = [...contentDigest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const ownerHash = candidate.visibility === "private"
    ? new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(candidate.owner)))
    : new Uint8Array();
  const identity = [...ownerHash].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const path = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(
    `${candidate.kind}:${identity}:${contentHash}:${contentType}`
  ));
  const pathHash = [...new Uint8Array(path)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `legacy/${pathHash}.${ASSET_EXTENSIONS[contentType]}`;
}

function privateAssetIsReferenced(state, user, reference) {
  const users = user.role === "admin"
    ? state.users || []
    : (state.users || []).filter((item) => item.email === user.email);
  for (const profile of users) {
    const docs = profile.idDocs || {};
    if (["front", "back", "selfie"].some((field) => docs[field] === reference)) return true;
  }
  const equipment = user.role === "admin"
    ? state.eq || []
    : (state.eq || []).filter((item) => item.owner === user.email);
  return equipment.some((item) => ["orcr", "permit"].some((field) => item[field]?.data === reference));
}

async function handleStorageUploadUrl(req) {
  const user = requireUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind || "");
  const contentType = String(body?.contentType || "").toLowerCase();
  const size = Number(body?.size);
  const imageTypes = ["image/jpeg", "image/png", "image/webp"];
  const privateTypes = [...imageTypes, "application/pdf"];
  const publicKind = ["avatar", "equipment-photo"].includes(kind);
  const allowedKind = ["avatar", "equipment-photo", "identity-document", "equipment-document"].includes(kind);
  if (!allowedKind || !Number.isSafeInteger(size) || size < 1
    || !Object.hasOwn(ASSET_EXTENSIONS, contentType)
    || (publicKind && !imageTypes.includes(contentType))
    || (!publicKind && !privateTypes.includes(contentType))
    || (kind === "identity-document" && contentType === "application/pdf")
    || (publicKind && size > PUBLIC_ASSET_MAX_BYTES)
    || (!publicKind && size > PRIVATE_ASSET_MAX_BYTES)) {
    throw new HttpError(400, "The selected file type or size is not allowed.");
  }
  if (["equipment-photo", "equipment-document"].includes(kind) && user.role !== "owner") {
    throw new HttpError(403, "Only equipment owners can upload listing media.");
  }
  if (kind === "identity-document" && !["customer", "owner"].includes(user.role)) {
    throw new HttpError(403, "Only customers and equipment owners can submit identity documents.");
  }

  const visibility = publicKind ? "public" : "private";
  const bucket = publicKind ? PUBLIC_ASSET_BUCKET : PRIVATE_ASSET_BUCKET;
  const path = `${user.id}/${kind}/${crypto.randomUUID()}.${ASSET_EXTENSIONS[contentType]}`;
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error) {
    console.error("Could not create a signed AgriRenta upload URL:", error);
    throw new HttpError(503, "AgriRenta file storage is not ready. Contact the administrator.");
  }
  return send(200, {
    ok: true,
    bucket,
    path: data.path,
    token: data.token,
    reference: `storage://${visibility}/${data.path}`,
  });
}

async function handlePrivateAssetUrls(req) {
  const user = requireUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body?.references) || body.references.some((reference) => typeof reference !== "string")) {
    throw new HttpError(400, "Private document references are invalid.");
  }
  const references = [...new Set(body.references)];
  if (!references.length || references.length > 100) {
    throw new HttpError(400, "Provide between 1 and 100 private document references.");
  }
  const prefix = "storage://private/";
  const state = await getState();
  if (!state) throw new HttpError(404, "Application data was not found.");
  const paths = references.map((reference) => {
    if (!reference.startsWith(prefix)) throw new HttpError(400, "Private asset reference is invalid.");
    const path = reference.slice(prefix.length);
    if (!path || path.startsWith("/") || path.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new HttpError(400, "Private asset path is invalid.");
    }
    if (!privateAssetIsReferenced(state, user, reference)) {
      throw new HttpError(403, "You are not allowed to view one of these private files.");
    }
    return { reference, path };
  });
  const signedUrls = await Promise.all(paths.map(async ({ reference, path }) => {
    const { data, error } = await supabase.storage.from(PRIVATE_ASSET_BUCKET).createSignedUrl(path, 900);
    if (error) {
      console.error("Could not create a signed AgriRenta document URL:", error);
      throw new HttpError(503, "Could not securely load a document. Please try again.");
    }
    return { reference, url: data.signedUrl };
  }));
  return send(200, { ok: true, urls: signedUrls, expiresIn: 900 });
}

async function handleAdminMigrateMedia(req) {
  requireAdminUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const limit = Number(body?.limit ?? 3);
  if (!Number.isInteger(limit) || limit < 1 || limit > 5) {
    throw new HttpError(400, "Migration batch size must be from 1 to 5 files.");
  }
  const savedState = await getState();
  if (!savedState) throw new HttpError(409, "Application data has not been initialized.");
  if (!collectLegacyMedia(savedState).length) {
    return send(200, { ok: true, migrated: 0, remaining: 0, updates: [] });
  }

  let updates = [];
  const state = await updateState(async (current) => {
    updates = [];
    const batch = collectLegacyMedia(current).slice(0, limit);
    for (const candidate of batch) {
      const { contentType, bytes } = decodeDataUrl(candidate.value);
      const maxBytes = candidate.visibility === "public" ? PUBLIC_ASSET_MAX_BYTES : PRIVATE_ASSET_MAX_BYTES;
      if (bytes.byteLength > maxBytes) {
        throw new HttpError(413, "A legacy file exceeds the configured Storage limit. Its original data remains unchanged.");
      }
      const path = await legacyMediaPath(candidate, contentType, bytes);
      const bucket = candidate.visibility === "public" ? PUBLIC_ASSET_BUCKET : PRIVATE_ASSET_BUCKET;
      const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
        cacheControl: "3600",
        contentType,
        upsert: true,
      });
      if (error) {
        console.error("Could not migrate an AgriRenta media file:", error);
        throw new HttpError(503, "A file could not be copied to Storage. Original data was left intact; retry the migration.");
      }
      const reference = `storage://${candidate.visibility}/${path}`;
      candidate.replace(reference);
      updates.push({
        section: candidate.section,
        recordKey: candidate.recordKey,
        field: candidate.field,
        reference,
      });
    }
    return current;
  });
  const remaining = collectLegacyMedia(state).length;
  return send(200, { ok: true, migrated: updates.length, remaining, updates });
}

function passwordValidationError(password) {
  const missing = [];
  if (password.length < 8) missing.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) missing.push("an uppercase letter");
  if (!/[a-z]/.test(password)) missing.push("a lowercase letter");
  if (!/[0-9]/.test(password)) missing.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) missing.push("a special character");
  return missing.length ? `Password must include ${missing.join(", ")}.` : null;
}

function ensureCommissionState(state) {
  state.commissionRecords = Array.isArray(state.commissionRecords) ? state.commissionRecords : [];
  state.commissionPayments = Array.isArray(state.commissionPayments) ? state.commissionPayments : [];
  state.commissionArchives = Array.isArray(state.commissionArchives) ? state.commissionArchives : [];
  const settings = state.commissionSettings && typeof state.commissionSettings === "object"
    ? state.commissionSettings
    : {};
  const gracePeriodDays = Number(settings.gracePeriodDays);
  state.commissionSettings = {
    paymentInstructions: typeof settings.paymentInstructions === "string" ? settings.paymentInstructions.slice(0, 2000) : "",
    gracePeriodDays: Number.isInteger(gracePeriodDays) && gracePeriodDays >= 1 && gracePeriodDays <= 30
      ? gracePeriodDays
      : DEFAULT_COMMISSION_GRACE_DAYS,
  };
  return state;
}

function amountCents(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) : 0;
}

function remainingCommissionCents(record) {
  return Math.max(0, amountCents(record.amount) - amountCents(record.paidAmount || 0));
}

function isBookingPaymentConfirmed(booking) {
  return booking.paymentStatus === "paid"
    || (booking.pay === "GCash" && booking.paymentStatus === "demo_completed");
}

function isCommissionEligibleBooking(booking) {
  return booking.status === "returned"
    && isBookingPaymentConfirmed(booking)
    && ["Cash on Delivery (COD)", "GCash"].includes(booking.pay)
    && booking.disputed !== true
    && booking.paymentDisputed !== true
    && Number.isFinite(Number(booking.total))
    && Number(booking.total) > 0;
}

function addCommissionSystemMessage(state, id, owner, text, time) {
  state.messages = Array.isArray(state.messages) ? state.messages : [];
  if (state.messages.some((message) => message.id === id)) return;
  state.messages.push({
    id,
    from: owner,
    thread: owner,
    author: "system",
    system: true,
    text,
    time,
  });
}

function syncCommissionRecords(state) {
  ensureCommissionState(state);
  const now = new Date();
  for (const booking of state.bookings || []) {
    if (!isCommissionEligibleBooking(booking) || !booking.ref || !booking.owner
      || state.commissionRecords.some((record) => record.bookingRef === booking.ref)) continue;
    const rentalCents = amountCents(booking.total);
    const commissionCents = Math.round(rentalCents * COMMISSION_RATE);
    if (commissionCents < 1) continue;
    const confirmationTimes = [booking.statusUpdatedAt, booking.paymentVerifiedAt]
      .map((value) => Date.parse(value || ""))
      .filter((value) => Number.isFinite(value));
    const earnedTime = confirmationTimes.length ? Math.max(...confirmationTimes) : now.getTime();
    const earnedAt = new Date(earnedTime).toISOString();
    const dueAt = new Date(earnedTime + state.commissionSettings.gracePeriodDays * 86400000);
    state.commissionRecords.push({
      id: `COM-${booking.ref}`,
      bookingRef: booking.ref,
      owner: booking.owner,
      rentalAmount: rentalCents / 100,
      rate: COMMISSION_RATE,
      amount: commissionCents / 100,
      paidAmount: 0,
      status: "unpaid",
      earnedAt,
      dueAt: dueAt.toISOString(),
    });
    addCommissionSystemMessage(
      state,
      `SYS-COMMISSION-DUE-${booking.ref}`,
      booking.owner,
      `AgriRenta commission notice: rental ${booking.ref} is complete. Customer rental total: ₱${(rentalCents / 100).toFixed(2)}. Commission (10%): ₱${(commissionCents / 100).toFixed(2)}, due by ${dueAt.toLocaleDateString("en-PH")}. Pay within ${state.commissionSettings.gracePeriodDays} days to avoid a new-booking restriction. PayDemo is a simulation only; no real money is transferred.`,
      earnedAt,
    );
  }
  return state;
}

function isOwnerCommissionRestricted(state, owner) {
  const now = Date.now();
  return (state.commissionRecords || []).some((record) =>
    record.owner === owner
      && !["disputed", "waived"].includes(record.status)
      && remainingCommissionCents(record) > 0
      && Number.isFinite(Date.parse(record.dueAt))
      && now > Date.parse(record.dueAt)
  );
}

function bookingEndTimestamp(booking) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(booking.end || ""))
    ? Date.parse(`${booking.end}T00:00:00+08:00`)
    : NaN;
}

function isOwnerCompletionPending(booking) {
  return booking.status === "approved"
    || (booking.status === "returned"
      && ["Cash on Delivery (COD)", "GCash"].includes(booking.pay)
      && !isBookingPaymentConfirmed(booking));
}

function ownerCompletionDeadline(booking) {
  if (!isOwnerCompletionPending(booking)) return NaN;
  const endTime = bookingEndTimestamp(booking);
  const returnedAt = booking.status === "returned" ? Date.parse(booking.statusUpdatedAt || "") : NaN;
  const baseTime = Number.isFinite(returnedAt) ? returnedAt : endTime;
  return Number.isFinite(baseTime) ? baseTime + OWNER_COMPLETION_GRACE_MS : NaN;
}

function isOwnerCompletionOverdue(booking, now = Date.now()) {
  const deadline = ownerCompletionDeadline(booking);
  return Number.isFinite(deadline) && now >= deadline;
}

function isOwnerCompletionReminderDue(booking, now = Date.now()) {
  if (!isOwnerCompletionPending(booking)) return false;
  if (booking.status === "returned") return true;
  const endTime = bookingEndTimestamp(booking);
  return Number.isFinite(endTime) && now >= endTime;
}

function isOwnerBookingRestricted(state, owner) {
  return isOwnerCommissionRestricted(state, owner)
    || (state.bookings || []).some((booking) =>
      booking.owner === owner && isOwnerCompletionOverdue(booking)
    );
}

function commissionStateNeedsSync(state) {
  const records = Array.isArray(state.commissionRecords) ? state.commissionRecords : [];
  return (state.bookings || []).some((booking) =>
    isCommissionEligibleBooking(booking)
      && !records.some((record) => record.bookingRef === booking.ref)
  );
}

function settleCommissionPayment(state, payment) {
  const amount = amountCents(payment.amount);
  const records = state.commissionRecords
    .filter((record) => record.owner === payment.owner && !["disputed", "waived"].includes(record.status))
    .filter((record) => !payment.commissionId || record.id === payment.commissionId)
    .filter((record) => remainingCommissionCents(record) > 0)
    .sort((a, b) => Date.parse(a.earnedAt) - Date.parse(b.earnedAt));
  const available = records.reduce((sum, record) => sum + remainingCommissionCents(record), 0);
  if (amount < 1 || amount > available) {
    throw new HttpError(409, "The payment cannot be allocated to the owner's eligible outstanding commissions.");
  }
  let remaining = amount;
  const allocations = [];
  for (const record of records) {
    if (!remaining) break;
    const applied = Math.min(remaining, remainingCommissionCents(record));
    record.paidAmount = (amountCents(record.paidAmount || 0) + applied) / 100;
    record.status = remainingCommissionCents(record) === 0 ? "paid" : "unpaid";
    record.lastPaidAt = new Date().toISOString();
    if (record.status === "paid") record.paidAt = record.lastPaidAt;
    allocations.push({ commissionId: record.id, amount: applied / 100 });
    remaining -= applied;
  }
  payment.allocations = allocations;
}

// ---------------------------------------------------------------------------
// Business rules (unchanged from the old Node backend)
// ---------------------------------------------------------------------------
function publicState(state, user) {
  const copy = ensureCommissionState(structuredClone(state));
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
      item.bookingRestricted = isOwnerBookingRestricted(copy, item.owner);
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
    if (user?.role === "owner") {
      copy.commissionRecords = copy.commissionRecords.filter((record) => record.owner === user.email);
      copy.commissionPayments = copy.commissionPayments.filter((payment) => payment.owner === user.email);
      copy.commissionArchives = copy.commissionArchives.filter((item) => item.owner === user.email);
    } else {
      copy.commissionRecords = [];
      copy.commissionPayments = [];
      copy.commissionArchives = [];
      delete copy.commissionSettings;
    }
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
  ensureCommissionState(merged);
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
      if (existing) {
        delete existing.commissionRestricted;
        delete existing.bookingRestricted;
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
      if (existing.status === "pending" && ["approved", "declined"].includes(updated.status)
        && !(existing.pay === "GCash" && updated.status === "declined")) existing.status = updated.status;
      else if (existing.status === "approved" && updated.status === "returned") {
        existing.status = "returned";
        existing.statusUpdatedAt = new Date().toISOString();
      }
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

function preserveStoredMediaReferences(current, next) {
  const preserve = (oldValue, newObject, key, visibility) => {
    if (isStorageRef(oldValue, visibility) && typeof newObject?.[key] === "string"
      && newObject[key].startsWith("data:")) newObject[key] = oldValue;
  };
  const currentUsers = new Map((current.users || []).map((item) => [item.email, item]));
  for (const user of next.users || []) {
    const oldUser = currentUsers.get(user.email);
    if (!oldUser) continue;
    preserve(oldUser.avatar, user, "avatar", "public");
    for (const field of ["front", "back", "selfie"]) {
      preserve(oldUser.idDocs?.[field], user.idDocs, field, "private");
    }
  }
  const currentEquipment = new Map((current.eq || []).map((item) => [String(item.id), item]));
  for (const item of next.eq || []) {
    const oldItem = currentEquipment.get(String(item.id));
    if (!oldItem) continue;
    preserve(oldItem.img, item, "img", "public");
    for (const field of ["orcr", "permit"]) {
      preserve(oldItem[field]?.data, item[field], "data", "private");
    }
    for (let index = 0; index < Math.min(oldItem.photos?.length || 0, item.photos?.length || 0); index++) {
      preserve(oldItem.photos[index]?.data, item.photos[index], "data", "public");
    }
  }
  return next;
}

function memberStateError(current, incoming, user) {
  const email = user.email;
  const bookings = current.bookings || [];
  const requestedBookings = incoming.bookings || [];
  const savedUser = (current.users || []).find((item) => item.email === email);
  const submittedUser = (incoming.users || []).find((item) => item.email === email);
  if (submittedUser?.idDocs && JSON.stringify(submittedUser.idDocs) !== JSON.stringify(savedUser?.idDocs)) {
    const docs = submittedUser.idDocs;
    const savedDocs = savedUser?.idDocs || {};
    const validImage = (value, field) => (typeof value === "string" && /^data:image\/(?:jpeg|png|webp);base64,/i.test(value))
      || (value === savedDocs[field] && isStorageRef(value, "private"))
      || isOwnedPrivateUploadReference(value, user, "identity-document");
    if (submittedUser.v?.id !== "review" || submittedUser.v?.selfie !== "review"
      || !validImage(docs.front, "front") || !validImage(docs.back, "back") || !validImage(docs.selfie, "selfie")
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
      if (isOwnerBookingRestricted(current, equipment.owner)) {
        return "This owner is temporarily unable to accept new booking requests because of overdue commission or an unconfirmed completed rental.";
      }
      const overlap = bookings.some((old) => Number(old.eq) === Number(booking.eq)
        && ["pending", "approved"].includes(old.status) && booking.start < old.end && booking.end > old.start);
      const blocked = (current.availability || []).some((period) => Number(period.eq) === Number(booking.eq)
        && booking.start <= period.end && booking.end > period.start);
      if (overlap || blocked) return "Those dates are unavailable. Please choose another date range.";
    }
  }
  if (user.role === "owner") {
    for (const booking of requestedBookings) {
      const existing = bookings.find((item) => item.ref === booking.ref);
      if (existing?.owner === email && existing.status === "pending"
        && existing.pay === "GCash" && booking.status === "declined") {
        return "GCash rental requests cannot be declined. Please accept the request or contact the renter.";
      }
    }
    const savedEquipment = new Map((current.eq || []).filter((item) => item.owner === email).map((item) => [String(item.id), item]));
    for (const item of incoming.eq || []) {
      const existing = savedEquipment.get(String(item.id));
      if (existing && existing.owner === email && item.visible !== undefined && typeof item.visible !== "boolean") {
        return "Listing visibility setting is invalid.";
      }
      if (item.owner === email) {
        for (const field of ["orcr", "permit"]) {
          const value = item[field]?.data;
          const oldValue = existing?.[field]?.data;
          if (isStorageRef(value, "private") && value !== oldValue
            && !isOwnedPrivateUploadReference(value, user, "equipment-document")) {
            return "Equipment documents must be uploaded to your own private Storage folder.";
          }
        }
      }
    }
    if ((incoming.withdrawals || []).some((item) =>
      !(current.withdrawals || []).some((existing) => existing.id === item.id)
    )) {
      return "Owner cash-outs are disabled because rental payments go directly to equipment owners.";
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
    && (state.commissionRecords === undefined || Array.isArray(state.commissionRecords))
    && (state.commissionPayments === undefined || Array.isArray(state.commissionPayments))
    && (state.commissionSettings === undefined || (state.commissionSettings && typeof state.commissionSettings === "object" && !Array.isArray(state.commissionSettings)))
    && (state.notificationReads === undefined || (state.notificationReads && typeof state.notificationReads === "object" && !Array.isArray(state.notificationReads)));
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------
async function handleBootstrap(req) {
  const body = await req.json().catch(() => null);
  if (!isValidState(body?.state)) throw new HttpError(400, "Initial application data is invalid.");
  const state = syncCommissionRecords(stripSecrets(body.state));
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
  let state = await getState();
  if (state && commissionStateNeedsSync(state)) state = await updateState(syncCommissionRecords);
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
    syncCommissionRecords(before);
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
    if (user.role === "admin") {
      next.commissionRecords = before.commissionRecords;
      next.commissionPayments = before.commissionPayments;
      next.commissionSettings = before.commissionSettings;
    }
    for (const item of next.eq || []) {
      delete item.commissionRestricted;
      delete item.bookingRestricted;
    }
    return stripSecrets(syncCommissionRecords(preserveStoredMediaReferences(before, next)));
  }, { unconditional: user.role === "admin" });
  return send(200, { ok: true });
}

async function handleLoginCheck(req) {
  const user = requireUser(await currentUser(req));
  return send(200, { ok: true, user: { email: user.email, role: user.role } });
}

async function handleRegister(req) {
  const header = req.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Please verify your email before continuing.");
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) throw new HttpError(401, "Your verified account session could not be found. Please log in.");
  const authUser = authData.user;
  if (!authUser.email_confirmed_at) throw new HttpError(403, "Verify your email address before creating an AgriRenta profile.");
  const email = String(authUser.email || "").trim().toLowerCase();
  const name = String(authUser.user_metadata?.name || "").trim();
  const phone = String(authUser.user_metadata?.phone || "").trim();
  const role = String(authUser.app_metadata?.role || authUser.user_metadata?.role || "");
  if (!email || !name || !phone || !["customer", "owner"].includes(role)) {
    throw new HttpError(400, "Registration details are incomplete. Return to sign-up and try again.");
  }
  if (authUser.app_metadata?.role && authUser.app_metadata.role !== role) {
    throw new HttpError(409, "This account already has a different account type.");
  }
  const addProfile = (state) => {
    state.users = Array.isArray(state.users) ? state.users : [];
    const profile = state.users.find((item) => item.email === email);
    if (profile) {
      profile.name = name;
      profile.phone = phone;
      profile.v = profile.v && typeof profile.v === "object" ? profile.v : {};
      profile.v.email = 1;
    } else {
      state.users.push({ email, name, role, phone, v: { email: 1 } });
    }
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
  if (!authUser.app_metadata?.role) {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      app_metadata: { ...(authUser.app_metadata || {}), role },
    });
    if (error) throw error;
  }
  return send(201, { ok: true, user: { email, role, name, phone } });
}

async function handlePassword(req) {
  const user = requireUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const currentPassword = String(body?.currentPassword || "");
  const newPassword = String(body?.newPassword || "");
  const passwordError = passwordValidationError(newPassword);
  if (passwordError) throw new HttpError(400, passwordError);
  if (!currentPassword) throw new HttpError(400, "Enter your current password.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || req.headers.get("apikey");
  if (!supabaseUrl || !publicKey) throw new HttpError(503, "Password verification is not configured.");
  const verification = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publicKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: currentPassword }),
  });
  if (verification.status === 400 || verification.status === 401) {
    throw new HttpError(401, "Current password is incorrect.");
  }
  if (!verification.ok) throw new HttpError(502, "Could not verify the current password. Please try again.");
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) throw new HttpError(400, error.message || "Could not update the password.");
  return send(200, { ok: true });
}

async function handleCommissionPayment(req) {
  const user = requireUser(await currentUser(req));
  if (user.role !== "owner") throw new HttpError(403, "Only equipment owners can submit commission payments.");
  const body = await req.json().catch(() => ({}));
  const amount = Number(body?.amount);
  const reference = String(body?.reference || "").trim();
  const payment = await updateState((state) => {
    syncCommissionRecords(state);
    const cents = amountCents(amount);
    const referenceKey = reference.toLowerCase();
    if (!Number.isFinite(amount) || cents < 1 || Math.abs(amount * 100 - cents) > 0.000001
      || reference.length < 2 || reference.length > 120) {
      throw new HttpError(400, "Enter a valid payment amount and GCash transaction reference.");
    }
    if (state.commissionPayments.some((item) =>
      String(item.reference || "").trim().toLowerCase() === referenceKey
    )) throw new HttpError(409, "That GCash reference has already been submitted.");
    const outstanding = state.commissionRecords
      .filter((record) => record.owner === user.email && !["disputed", "waived"].includes(record.status))
      .reduce((sum, record) => sum + remainingCommissionCents(record), 0)
      - state.commissionPayments.filter((item) => item.owner === user.email && item.status === "pending_verification")
        .reduce((sum, item) => sum + amountCents(item.amount), 0);
    if (cents > outstanding) throw new HttpError(400, "Payment amount exceeds your eligible outstanding commission.");
    const record = {
      id: `CMP-${crypto.randomUUID()}`,
      owner: user.email,
      amount: cents / 100,
      reference,
      status: "pending_verification",
      createdAt: new Date().toISOString(),
    };
    state.commissionPayments.push(record);
    return record;
  });
  const state = await getState();
  return send(201, { ok: true, payment, state: publicState(state, user) });
}

async function handleCommissionDemoPayment(req) {
  const user = requireUser(await currentUser(req));
  if (user.role !== "owner") throw new HttpError(403, "Only equipment owners can pay commission.");
  const body = await req.json().catch(() => ({}));
  const commissionId = String(body?.commissionId || "");
  const attemptId = String(body?.attemptId || "");
  const receiptAmount = Number(body?.amount);
  const receiptRentalAmount = Number(body?.rentalAmount);
  const receiptCommissionAmount = Number(body?.commissionAmount);
  const bookingRef = String(body?.bookingRef || "");
  if (!commissionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attemptId)) {
    throw new HttpError(400, "The simulated commission payment details are invalid.");
  }

  let payment;
  const state = await updateState((current) => {
    syncCommissionRecords(current);
    const previous = current.commissionPayments.find((item) => item.demoAttemptId === attemptId);
    if (previous) {
      if (previous.owner !== user.email || previous.commissionId !== commissionId) {
        throw new HttpError(409, "This simulated payment reference was already used.");
      }
      if (amountCents(receiptAmount) !== amountCents(previous.amount)
        || amountCents(receiptRentalAmount) !== amountCents(previous.rentalAmount)
        || amountCents(receiptCommissionAmount) !== amountCents(previous.commissionAmount)
        || bookingRef !== previous.bookingRef) {
        throw new HttpError(409, "The receipt details do not match this simulated payment.");
      }
      payment = previous;
      return current;
    }
    if (current.commissionPayments.some((item) =>
      item.owner === user.email && item.status === "pending_verification"
    )) {
      throw new HttpError(409, "Wait for the pending commission payment to be reviewed before starting a demo payment.");
    }
    const record = current.commissionRecords.find((item) =>
      item.id === commissionId && item.owner === user.email
    );
    const amount = record ? remainingCommissionCents(record) : 0;
    if (!record || amount < 1 || ["disputed", "waived"].includes(record.status)) {
      throw new HttpError(409, "This commission is no longer payable.");
    }
    if (amountCents(receiptAmount) !== amount
      || amountCents(receiptRentalAmount) !== amountCents(record.rentalAmount)
      || amountCents(receiptCommissionAmount) !== amountCents(record.amount)
      || bookingRef !== record.bookingRef) {
      throw new HttpError(409, "The receipt details do not match the outstanding commission.");
    }

    const processedAt = new Date().toISOString();
    payment = {
      id: `CMP-DEMO-${attemptId}`,
      demoAttemptId: attemptId,
      commissionId: record.id,
      bookingRef: record.bookingRef,
      owner: user.email,
      amount: amount / 100,
      rentalAmount: Number(record.rentalAmount),
      commissionAmount: Number(record.amount),
      reference: `DEMO-CM-${attemptId.slice(0, 12).toUpperCase()}`,
      method: "PayDemo",
      source: "demo",
      status: "simulated",
      createdAt: processedAt,
      processedAt,
      processedBy: "system",
    };
    settleCommissionPayment(current, payment);
    current.commissionPayments.push(payment);
    addCommissionSystemMessage(
      current,
      `SYS-COMMISSION-PAID-${attemptId}`,
      user.email,
      `PayDemo commission receipt (SIMULATED — no money transferred): rental ${record.bookingRef}; customer rental total ₱${Number(record.rentalAmount).toFixed(2)}; 10% commission ₱${Number(record.amount).toFixed(2)}; simulated payment ₱${payment.amount.toFixed(2)}; reference ${payment.reference}.`,
      processedAt,
    );
    return current;
  });
  return send(200, { ok: true, payment, state: publicState(state, user) });
}

async function handleCommissionPaymentReview(req) {
  const user = requireAdminUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const paymentId = String(body?.paymentId || "");
  const decision = String(body?.decision || "");
  const note = String(body?.note || "").trim();
  if (!paymentId || !["verify", "reject"].includes(decision) || note.length > 500) {
    throw new HttpError(400, "Commission payment decision is invalid.");
  }
  const state = await updateState((current) => {
    syncCommissionRecords(current);
    const payment = current.commissionPayments.find((item) => item.id === paymentId);
    if (!payment) throw new HttpError(404, "Commission payment submission was not found.");
    if (payment.status !== "pending_verification") throw new HttpError(409, "This commission payment has already been reviewed.");
    if (decision === "verify") {
      settleCommissionPayment(current, payment);
      payment.status = "verified";
    } else {
      payment.status = "rejected";
    }
    payment.reviewNote = note;
    payment.processedAt = new Date().toISOString();
    payment.processedBy = user.email;
    return current;
  });
  return send(200, { ok: true, state: publicState(state, user) });
}

async function handleCommissionDispute(req) {
  const user = requireUser(await currentUser(req));
  if (user.role !== "owner") throw new HttpError(403, "Only equipment owners can dispute commission records.");
  const body = await req.json().catch(() => ({}));
  const commissionId = String(body?.commissionId || "");
  const reason = String(body?.reason || "").trim();
  if (!commissionId || reason.length < 5 || reason.length > 1000) {
    throw new HttpError(400, "Explain the commission dispute in 5 to 1000 characters.");
  }
  const state = await updateState((current) => {
    syncCommissionRecords(current);
    if (current.commissionPayments.some((item) => item.owner === user.email && item.status === "pending_verification")) {
      throw new HttpError(409, "Wait for your pending GCash payment to be reviewed before disputing another commission.");
    }
    const record = current.commissionRecords.find((item) => item.id === commissionId && item.owner === user.email);
    if (!record || remainingCommissionCents(record) < 1 || ["paid", "waived"].includes(record.status)) {
      throw new HttpError(404, "Outstanding commission record was not found.");
    }
    if (record.status === "disputed") throw new HttpError(409, "This commission is already under dispute.");
    record.status = "disputed";
    record.disputeReason = reason;
    record.disputedAt = new Date().toISOString();
    record.disputeStatus = "pending";
    return current;
  });
  return send(200, { ok: true, state: publicState(state, user) });
}

async function handleCommissionDisputeReview(req) {
  const user = requireAdminUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const commissionId = String(body?.commissionId || "");
  const decision = String(body?.decision || "");
  const note = String(body?.note || "").trim();
  if (!commissionId || !["uphold", "waive"].includes(decision) || note.length > 500) {
    throw new HttpError(400, "Commission dispute decision is invalid.");
  }
  const state = await updateState((current) => {
    syncCommissionRecords(current);
    const record = current.commissionRecords.find((item) => item.id === commissionId);
    if (!record || record.status !== "disputed") throw new HttpError(404, "Pending commission dispute was not found.");
    record.status = decision === "waive" ? "waived" : "unpaid";
    record.disputeStatus = decision === "waive" ? "waived" : "upheld";
    record.disputeResolution = note;
    record.resolvedAt = new Date().toISOString();
    record.resolvedBy = user.email;
    if (decision === "uphold") {
      record.dueAt = new Date(Date.now() + current.commissionSettings.gracePeriodDays * 86400000).toISOString();
    }
    return current;
  });
  return send(200, { ok: true, state: publicState(state, user) });
}

async function handleCommissionArchive(req) {
  const user = requireUser(await currentUser(req));
  if (user.role !== "owner") throw new HttpError(403, "Only equipment owners can archive commission history.");
  const body = await req.json().catch(() => ({}));
  const itemType = String(body?.itemType || "");
  const itemId = String(body?.itemId || "");
  const action = typeof body?.action === "string"
    ? body.action
    : typeof body?.archive === "boolean" ? (body.archive ? "archive" : "restore") : "";
  if (!["record", "payment", "booking"].includes(itemType) || !itemId || itemId.length > 200
    || !["archive", "restore", "hide"].includes(action)) {
    throw new HttpError(400, "Choose a valid rental, commission record, or payment history entry.");
  }

  const state = await updateState((current) => {
    syncCommissionRecords(current);
    const items = itemType === "record" ? current.commissionRecords
      : itemType === "payment" ? current.commissionPayments : current.bookings;
    const ownerItem = items.find((entry) =>
      String(itemType === "booking" ? entry.ref : entry.id) === itemId && entry.owner === user.email
    );
    if (!ownerItem) throw new HttpError(404, "That rental or commission history entry was not found for this account.");

    const archiveIndex = current.commissionArchives.findIndex((entry) =>
      entry.owner === user.email && entry.itemType === itemType && String(entry.itemId) === itemId
    );
    if (action === "archive") {
      if (itemType === "record") {
        const resolved = ownerItem.status === "waived"
          || (ownerItem.status !== "disputed" && remainingCommissionCents(ownerItem) === 0);
        if (!resolved) throw new HttpError(409, "Only settled or waived commission records can be archived.");
      } else if (itemType === "payment" && !["simulated", "verified", "rejected"].includes(ownerItem.status)) {
        throw new HttpError(409, "Pending or unresolved commission payments cannot be archived.");
      } else if (itemType === "booking" && ownerItem.status !== "returned") {
        throw new HttpError(409, "Only returned rentals can be archived.");
      }
      if (archiveIndex < 0) {
        current.commissionArchives.push({
          owner: user.email,
          itemType,
          itemId,
          archivedAt: new Date().toISOString(),
        });
      }
    } else if (action === "restore") {
      if (archiveIndex < 0) throw new HttpError(404, "That entry is not archived.");
      if (current.commissionArchives[archiveIndex].hiddenFromOwner === true) {
        throw new HttpError(409, "An entry deleted from your view cannot be restored.");
      }
      current.commissionArchives.splice(archiveIndex, 1);
    } else {
      if (archiveIndex < 0) throw new HttpError(409, "Archive this entry before removing it from your view.");
      current.commissionArchives[archiveIndex].hiddenFromOwner = true;
      current.commissionArchives[archiveIndex].hiddenAt = new Date().toISOString();
    }
    return current;
  });
  return send(200, { ok: true, state: publicState(state, user) });
}

async function handleCommissionSettings(req) {
  const user = requireAdminUser(await currentUser(req));
  const body = await req.json().catch(() => ({}));
  const paymentInstructions = String(body?.paymentInstructions || "").trim();
  const gracePeriodDays = Number(body?.gracePeriodDays);
  if (paymentInstructions.length > 2000 || !Number.isInteger(gracePeriodDays)
    || gracePeriodDays < 1 || gracePeriodDays > 30) {
    throw new HttpError(400, "Enter GCash instructions under 2000 characters and a grace period from 1 to 30 days.");
  }
  const state = await updateState((current) => {
    ensureCommissionState(current);
    current.commissionSettings = { paymentInstructions, gracePeriodDays };
    return current;
  });
  return send(200, { ok: true, state: publicState(state, user) });
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
    for (const item of state.commissionRecords || []) if (item.owner === oldEmail) item.owner = newEmail;
    for (const item of state.commissionPayments || []) if (item.owner === oldEmail) item.owner = newEmail;
    for (const item of state.commissionArchives || []) if (item.owner === oldEmail) item.owner = newEmail;
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
    if (booking.paymentStatus !== "paid") {
      booking.paymentStatus = "demo_completed";
      booking.paymentVerifiedAt = booking.paymentVerifiedAt || new Date().toISOString();
      booking.paymentVerifiedBy = "demo";
    }
    syncCommissionRecords(state);
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
  "POST /password": handlePassword,
  "POST /role": handleRole,
  "PUT /profile": handleProfile,
  "POST /admin/verification": handleVerification,
  "POST /payment/gcash-demo-complete": handleGcashDemo,
  "POST /commission/payment": handleCommissionPayment,
  "POST /commission/demo-payment": handleCommissionDemoPayment,
  "POST /commission/archive": handleCommissionArchive,
  "POST /commission/payment-review": handleCommissionPaymentReview,
  "POST /commission/dispute": handleCommissionDispute,
  "POST /commission/dispute-review": handleCommissionDisputeReview,
  "POST /commission/settings": handleCommissionSettings,
  "POST /storage/upload-url": handleStorageUploadUrl,
  "POST /storage/private-urls": handlePrivateAssetUrls,
  "POST /admin/migrate-media": handleAdminMigrateMedia,
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
