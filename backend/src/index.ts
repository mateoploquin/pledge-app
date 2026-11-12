import { Hono } from "hono";
import { logger } from "hono/logger";
import type { DecodedIdToken } from "firebase-admin/auth";
import { db, devicesRef, firebaseApp, getPledge, getUser, pledgesRef, saveUsage, upsertUser, verifyIdToken, type PledgeRecord } from "./firebase.js";
import { getAuth } from "firebase-admin/auth";
import { checkDevices, forfeitActivePledges } from "./forfeit.js";
import { apnsConfigured } from "./apns.js";
import { cardSummary, chargeBreak, chargePledge, createPaymentSheetParams, customerIdOf, ensureCustomer, hasPaymentMethod, stripe } from "./stripe.js";
import { privacyHtml, termsHtml } from "./legal.js";
import { COACH_CONTEXTS, CoachLimitError, coachConfigured, coachTurn, listMessages, type CoachContext } from "./coach.js";

type Env = { Variables: { user: DecodedIdToken } };

const app = new Hono<Env>();
app.use("*", logger());

app.onError((err, c) => {
  const status = (err as any).status ?? 500;
  if (status >= 500) console.error(err);
  return c.json({ error: err.message ?? "Internal error" }, status);
});

app.get("/", (c) => c.json({ ok: true, service: "pledge-backend" }));
app.get("/health", (c) => c.json({ ok: true }));

app.get("/terms", (c) => c.html(termsHtml));
app.get("/privacy", (c) => c.html(privacyHtml));

app.get("/stripe/publishable-key", (c) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return c.json({ error: "STRIPE_PUBLISHABLE_KEY is not configured" }, 500);
  }
  return c.json({ publishableKey });
});

// Everything below requires a Firebase ID token.
app.use("/auth/*", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/pledge/*", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/pledges", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/device", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/heartbeat", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/stripe/payment-method", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/pledge", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/stripe/payment-sheet", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/stripe/charge", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/stripe/break", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/charges", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/account", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});
app.use("/coach/*", async (c, next) => {
  c.set("user", await verifyIdToken(c.req.header("authorization")));
  await next();
});

app.post("/auth/firebase/signup", async (c) => {
  const decoded = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const user = await upsertUser(decoded, {
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
  });
  return c.json({ uid: user.uid, email: user.email, displayName: user.displayName });
});

app.post("/stripe/payment-sheet", async (c) => {
  const decoded = c.get("user");
  const user = await upsertUser(decoded);
  const customerId = await ensureCustomer(decoded, user);
  return c.json(await createPaymentSheetParams(customerId));
});

app.get("/stripe/payment-method", async (c) => {
  const user = await getUser(c.get("user").uid);
  const card = await cardSummary(user);
  return c.json({ hasCard: !!card || (await hasPaymentMethod(user)), card });
});

const PLEDGE_MIN = 1;
const PLEDGE_MAX = 100;
const TIME_MIN = 0;
const TIME_MAX = 24 * 60;
const DURATION_MIN = 1;
const DURATION_MAX = 365;

/** The phone registers its Apple push token so deletion can be detected. */
app.post("/device", async (c) => {
  const decoded = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!/^[0-9a-f]{32,200}$/i.test(token)) return c.json({ error: "token must be an APNs device token" }, 400);
  await upsertUser(decoded);
  const now = new Date().toISOString();
  const ref = devicesRef(decoded.uid).doc(token.toLowerCase());
  const existing = (await ref.get()).data();
  await ref.set(
    {
      token: token.toLowerCase(),
      platform: "ios",
      registeredAt: existing?.registeredAt ?? now,
      lastSeenAt: now,
      // Re-registering means the app is installed again; a fresh install
      // gets a new token anyway, but be safe.
      unregisteredAt: null,
    },
    { merge: true }
  );
  return c.json({ ok: true, pushConfigured: apnsConfigured() });
});

/**
 * The app reports in whenever it runs. Losing Screen Time access while a
 * pledge is active forfeits it under the terms.
 */
app.post("/heartbeat", async (c) => {
  const decoded = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const screenTimeAuthorized = body.screenTimeAuthorized !== false;
  await upsertUser(decoded, { lastHeartbeatAt: new Date().toISOString(), screenTimeAuthorized });
  await saveUsage(decoded.uid, body.usage);

  let forfeited: string[] = [];
  if (!screenTimeAuthorized) {
    forfeited = await forfeitActivePledges(decoded.uid, "screen_time_revoked");
  }
  const activeSnap = await pledgesRef(decoded.uid).where("status", "==", "active").get();
  return c.json({ ok: true, forfeited, active: activeSnap.docs.map((d) => d.id) });
});

/** Vercel cron: ping every device with an active pledge; forfeit deleted ones. */
app.get("/cron/check-devices", async (c) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.header("authorization") !== `Bearer ${secret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!apnsConfigured()) return c.json({ error: "APNs is not configured" }, 500);
  const report = await checkDevices();
  console.log("check-devices:", JSON.stringify(report));
  return c.json(report);
});

const ID_RE = /^[a-z0-9]{6,32}$/;
const PURPOSE_MAX = 280;

/** Creates a pledge. Several may be active at once, one per selection of apps. */
app.post("/pledge", async (c) => {
  const decoded = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const pledgeValue = Number(body.pledgeValue);
  const timeValue = Number(body.timeValue);
  // Older app builds send no duration; they run for 30 days.
  const durationDays = body.durationDays === undefined ? 30 : Number(body.durationDays);
  const id = typeof body.id === "string" ? body.id : Math.random().toString(36).slice(2, 12);

  if (!ID_RE.test(id)) return c.json({ error: "id must be 6-32 lowercase letters or digits" }, 400);
  // What the time is for, in the user's words; optional, read by the coach.
  const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
  if (purpose.length > PURPOSE_MAX) return c.json({ error: `purpose must be at most ${PURPOSE_MAX} characters` }, 400);
  if (!Number.isFinite(pledgeValue) || pledgeValue < PLEDGE_MIN || pledgeValue > PLEDGE_MAX) {
    return c.json({ error: `pledgeValue must be between ${PLEDGE_MIN} and ${PLEDGE_MAX}` }, 400);
  }
  if (!Number.isFinite(timeValue) || timeValue < TIME_MIN || timeValue > TIME_MAX) {
    return c.json({ error: `timeValue must be between ${TIME_MIN} and ${TIME_MAX} minutes` }, 400);
  }
  if (!Number.isInteger(durationDays) || durationDays < DURATION_MIN || durationDays > DURATION_MAX) {
    return c.json({ error: `durationDays must be between ${DURATION_MIN} and ${DURATION_MAX}` }, 400);
  }

  await upsertUser(decoded);
  const ref = pledgesRef(decoded.uid).doc(id);
  const existing = (await ref.get()).data();
  if (existing) return c.json({ id, ...existing });

  const startedAt = typeof body.startedAt === "string" ? new Date(body.startedAt) : new Date();
  if (Number.isNaN(startedAt.getTime()) || startedAt.getTime() > Date.now() + 60_000) {
    return c.json({ error: "startedAt must be a past ISO date" }, 400);
  }
  const record = {
    pledgeValue,
    timeValue,
    durationDays,
    status: "active" as const,
    createdAt: startedAt.toISOString(),
    endsAt: new Date(startedAt.getTime() + durationDays * 86400000).toISOString(),
    ...(purpose ? { purpose } : {}),
  };
  await ref.set(record);
  return c.json({ id, ...record });
});

/** Active pledges; with ?status=all, ended ones too (Account, "Past pledges"), newest first. */
app.get("/pledges", async (c) => {
  const ref = pledgesRef(c.get("user").uid);
  const snap = c.req.query("status") === "all" ? await ref.get() : await ref.where("status", "==", "active").get();
  const pledges = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as PledgeRecord)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return c.json({ pledges });
});

/** Money actually taken (Account, "Charges"): pledges given up or forfeited, and paid breaks. Newest first. */
app.get("/charges", async (c) => {
  const snap = await db().collection("users").doc(c.get("user").uid).collection("charges").get();
  const charges = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, any>)
    .filter((ch) => ch.status === "succeeded" || ch.status === "processing")
    .map((ch) => ({
      id: ch.id,
      kind: ch.kind === "break" ? "break" : "pledge",
      amount: ch.amount,
      currency: ch.currency,
      pledgeId: ch.pledgeId,
      createdAt: ch.createdAt,
    }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return c.json({ charges });
});

/**
 * Deletes the account (Apple requires it in the app). Running pledges are
 * charged first, the same as giving up, and only with ?charge=1: without it
 * the answer is 409 with what would be charged, so the app can say so. Then
 * the Stripe customer, every Firestore record and the Firebase user go.
 */
app.delete("/account", async (c) => {
  const uid = c.get("user").uid;
  const user = await getUser(uid);
  const active = (await pledgesRef(uid).where("status", "==", "active").get()).docs.map(
    (d) => ({ id: d.id, ...d.data() }) as PledgeRecord
  );
  if (active.length > 0) {
    const total = active.reduce((sum, p) => sum + p.pledgeValue, 0);
    if (c.req.query("charge") !== "1") {
      return c.json({ error: "Running pledges must be paid first", activePledges: active.length, total }, 409);
    }
    if (!user) return c.json({ error: "Unknown user" }, 404);
    for (const pledge of active) {
      const outcome = await chargePledge(user, pledge);
      if (outcome.status !== "succeeded" && outcome.status !== "processing") {
        return c.json({ error: `Payment ${outcome.status}; the account was not deleted` }, 402);
      }
    }
  }
  if (customerIdOf(user)) {
    try {
      await stripe().customers.del(customerIdOf(user)!);
    } catch (err: any) {
      if (err?.code !== "resource_missing") throw err;
    }
  }
  await db().recursiveDelete(db().collection("users").doc(uid));
  await getAuth(firebaseApp()).deleteUser(uid);
  return c.json({ deleted: true });
});

app.post("/pledge/:id/complete", async (c) => {
  const uid = c.get("user").uid;
  const pledge = await getPledge(uid, c.req.param("id"));
  if (!pledge) return c.json({ error: "No such pledge" }, 404);
  if (pledge.status === "active") {
    await pledgesRef(uid)
      .doc(pledge.id)
      .set({ status: "completed", completedAt: new Date().toISOString() }, { merge: true });
  }
  return c.json({ id: pledge.id, status: pledge.status === "active" ? "completed" : pledge.status });
});

app.post("/stripe/charge", async (c) => {
  const uid = c.get("user").uid;
  const body = await c.req.json().catch(() => ({}));
  const user = await getUser(uid);
  if (!user) return c.json({ error: "Unknown user" }, 404);
  if (typeof body.pledgeId !== "string") return c.json({ error: "pledgeId is required" }, 400);
  const pledge = await getPledge(uid, body.pledgeId);
  if (!pledge) return c.json({ error: "No such pledge" }, 404);
  const outcome = await chargePledge(user, pledge);
  const httpStatus = outcome.status === "succeeded" || outcome.status === "processing" ? 200 : 402;
  return c.json(outcome, httpStatus);
});

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A paid 5-minute break: $1, up to three a day per pledge, the pledge keeps
 * running. `day` is the phone's local date, so "a day" matches what the user
 * sees; it must be within a day of the server's clock.
 */
app.post("/stripe/break", async (c) => {
  const uid = c.get("user").uid;
  const body = await c.req.json().catch(() => ({}));
  const user = await getUser(uid);
  if (!user) return c.json({ error: "Unknown user" }, 404);
  if (typeof body.pledgeId !== "string") return c.json({ error: "pledgeId is required" }, 400);
  const day = typeof body.day === "string" ? body.day : "";
  const dayMs = Date.parse(`${day}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(dayMs) || Math.abs(dayMs - Date.now()) > 1.5 * DAY_MS) {
    return c.json({ error: "day must be today's date as YYYY-MM-DD" }, 400);
  }
  const outcome = await chargeBreak(user, body.pledgeId, day);
  const httpStatus = outcome.status === "succeeded" || outcome.status === "processing" ? 200 : 402;
  return c.json(outcome, httpStatus);
});

/** The conversation so far, oldest first, without the hidden context notes. */
app.get("/coach/messages", async (c) => {
  const messages = await listMessages(c.get("user").uid);
  return c.json({ messages: messages.filter((m) => !m.hidden) });
});

/**
 * One coach turn. `text` may be empty when the app opens the coach at a
 * moment (`context`), so the coach speaks first. Returns the reply.
 */
app.post("/coach/message", async (c) => {
  if (!coachConfigured()) return c.json({ error: "The coach is not set up yet." }, 503);
  const body = await c.req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text : "";
  const context: CoachContext = COACH_CONTEXTS.includes(body.context) ? body.context : "home";
  if (!text.trim() && context === "home") return c.json({ error: "text is required" }, 400);
  try {
    const reply = await coachTurn(c.get("user").uid, text, context);
    return c.json({ reply });
  } catch (e) {
    if (e instanceof CoachLimitError) return c.json({ error: e.message }, 429);
    console.error("Coach turn failed:", e);
    return c.json({ error: "Your coach couldn't answer just now. Try again in a minute." }, 502);
  }
});

export default app;
