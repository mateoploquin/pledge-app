import { Hono } from "hono";
import { logger } from "hono/logger";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getUser, upsertUser, verifyIdToken } from "./firebase.js";
import { chargePledge, createPaymentSheetParams, ensureCustomer } from "./stripe.js";

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

const PLEDGE_MIN = 1;
const PLEDGE_MAX = 1000;
const TIME_MIN = 5;
const TIME_MAX = 24 * 60;

app.post("/pledge", async (c) => {
  const decoded = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const pledgeValue = Number(body.pledgeValue);
  const timeValue = Number(body.timeValue);

  if (!Number.isFinite(pledgeValue) || pledgeValue < PLEDGE_MIN || pledgeValue > PLEDGE_MAX) {
    return c.json({ error: `pledgeValue must be between ${PLEDGE_MIN} and ${PLEDGE_MAX}` }, 400);
  }
  if (!Number.isFinite(timeValue) || timeValue < TIME_MIN || timeValue > TIME_MAX) {
    return c.json({ error: `timeValue must be between ${TIME_MIN} and ${TIME_MAX} minutes` }, 400);
  }

  const user = await upsertUser(decoded, {
    pledgeValue,
    timeValue,
    pledgeSetAt: new Date().toISOString(),
  });
  return c.json({ pledgeValue: user.pledgeValue, timeValue: user.timeValue, pledgeSetAt: user.pledgeSetAt });
});

app.get("/pledge", async (c) => {
  const user = await getUser(c.get("user").uid);
  if (!user?.pledgeSetAt) return c.json({ error: "No pledge" }, 404);
  return c.json({ pledgeValue: user.pledgeValue, timeValue: user.timeValue, pledgeSetAt: user.pledgeSetAt });
});

app.post("/stripe/charge", async (c) => {
  const user = await getUser(c.get("user").uid);
  if (!user) return c.json({ error: "Unknown user" }, 404);
  const outcome = await chargePledge(user);
  const httpStatus = outcome.status === "succeeded" || outcome.status === "processing" ? 200 : 402;
  return c.json(outcome, httpStatus);
});

export default app;
