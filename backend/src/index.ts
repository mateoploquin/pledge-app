import { Hono } from "hono";
import { logger } from "hono/logger";
import type { DecodedIdToken } from "firebase-admin/auth";
import { devicesRef, getPledge, getUser, pledgesRef, upsertUser, verifyIdToken } from "./firebase.js";
import { checkDevices, forfeitActivePledges } from "./forfeit.js";
import { apnsConfigured } from "./apns.js";
import { chargePledge, createPaymentSheetParams, ensureCustomer, hasPaymentMethod } from "./stripe.js";
import { privacyHtml, termsHtml } from "./legal.js";

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
  return c.json({ hasCard: await hasPaymentMethod(user) });
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
  const now = new Date();
  const record = {
    pledgeValue,
    timeValue,
    durationDays,
    status: "active" as const,
    createdAt: now.toISOString(),
    endsAt: new Date(now.getTime() + durationDays * 86400000).toISOString(),
  };
  await pledgesRef(decoded.uid).doc(id).set(record);
  return c.json({ id, ...record });
});

app.get("/pledges", async (c) => {
  const snap = await pledgesRef(c.get("user").uid).where("status", "==", "active").get();
  return c.json({ pledges: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
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

export default app;
