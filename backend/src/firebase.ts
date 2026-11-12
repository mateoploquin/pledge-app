import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, FieldValue, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

function loadServiceAccount(): Record<string, string> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Paste the service-account JSON (raw or base64)."
    );
  }
  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

export function firebaseApp(): App {
  if (!app) {
    app = getApps()[0] ?? initializeApp({ credential: cert(loadServiceAccount()) });
  }
  return app;
}

export function db(): Firestore {
  return getFirestore(firebaseApp());
}

export { FieldValue };

export async function verifyIdToken(authorization?: string): Promise<DecodedIdToken> {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    throw Object.assign(new Error("Missing bearer token"), { status: 401 });
  }
  const auth = getAuth(firebaseApp()); // config errors surface as 500, not 401
  try {
    return await auth.verifyIdToken(token);
  } catch (err) {
    throw Object.assign(new Error("Invalid or expired token"), { status: 401, cause: err });
  }
}

export type UserRecord = {
  uid: string;
  email?: string;
  displayName?: string;
  stripeCustomerId?: string;
  /** The live-mode customer; `stripeCustomerId` is the sandbox one. */
  stripeCustomerIdLive?: string;
  pledgeValue?: number;
  timeValue?: number;
  durationDays?: number;
  pledgeSetAt?: string;
  createdAt?: string;
  updatedAt?: string;
  lastHeartbeatAt?: string;
  screenTimeAuthorized?: boolean;
};

export type PledgeStatus = "active" | "surrendered" | "completed" | "forfeited";
export type ForfeitReason = "app_deleted" | "screen_time_revoked";

export type PledgeRecord = {
  id: string;
  pledgeValue: number;
  timeValue: number;
  durationDays: number;
  status: PledgeStatus;
  createdAt: string;
  endsAt: string;
  chargedAt?: string;
  completedAt?: string;
  paymentIntentId?: string;
  forfeitReason?: ForfeitReason;
  /** Set when a forfeit charge was attempted but did not succeed. */
  chargeError?: string;
  /** Paid 5-minute breaks, counted per local day of the phone (YYYY-MM-DD). */
  breaks?: Record<string, number>;
};

export type DeviceRecord = {
  token: string;
  platform: "ios";
  registeredAt: string;
  lastSeenAt: string;
  /** Set once APNs reported the token as unregistered (app deleted). */
  unregisteredAt?: string;
};

export const devicesRef = (uid: string) =>
  db().collection("users").doc(uid).collection("devices");

export const pledgesRef = (uid: string) =>
  db().collection("users").doc(uid).collection("pledges");

export async function getPledge(uid: string, id: string): Promise<PledgeRecord | undefined> {
  const snap = await pledgesRef(uid).doc(id).get();
  return snap.exists ? ({ id, ...snap.data() } as PledgeRecord) : undefined;
}

export async function getUser(uid: string): Promise<UserRecord | undefined> {
  const snap = await db().collection("users").doc(uid).get();
  return snap.exists ? ({ uid, ...snap.data() } as UserRecord) : undefined;
}

export async function upsertUser(
  decoded: DecodedIdToken,
  extra: Partial<UserRecord> = {}
): Promise<UserRecord> {
  const ref = db().collection("users").doc(decoded.uid);
  const now = new Date().toISOString();
  const existing = (await ref.get()).data() as UserRecord | undefined;

  const data: Partial<UserRecord> = {
    email: decoded.email ?? existing?.email,
    displayName: extra.displayName ?? decoded.name ?? existing?.displayName,
    ...extra,
    updatedAt: now,
    createdAt: existing?.createdAt ?? now,
  };
  // Firestore rejects undefined values.
  for (const key of Object.keys(data) as (keyof UserRecord)[]) {
    if (data[key] === undefined) delete data[key];
  }
  await ref.set(data, { merge: true });
  return { uid: decoded.uid, ...existing, ...data };
}

/** One day of one pledge's use, as the phone saw it (5-min steps). */
export type UsageDay = { minutes: number; limit: number; limitReached: boolean; updatedAt: string };

export const usageRef = (uid: string) =>
  db().collection("users").doc(uid).collection("usage");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PLEDGE_ID_RE = /^[a-z0-9]{6,32}$/;

/**
 * Stores today's minutes per pledge from a heartbeat, in
 * `users/<uid>/usage/<YYYY-MM-DD>` keyed by pledge id. The coach reads it.
 * Bad entries are dropped, never rejected: the heartbeat must not fail.
 */
export async function saveUsage(uid: string, usage: unknown): Promise<void> {
  if (!Array.isArray(usage)) return;
  const byDate = new Map<string, Record<string, UsageDay>>();
  const now = new Date().toISOString();
  for (const u of usage.slice(0, 20)) {
    if (!u || typeof u !== "object") continue;
    const { pledgeId, date, minutes, limit, limitReached } = u as Record<string, unknown>;
    if (typeof pledgeId !== "string" || !PLEDGE_ID_RE.test(pledgeId)) continue;
    if (typeof date !== "string" || !DATE_RE.test(date)) continue;
    const m = Number(minutes);
    const l = Number(limit);
    if (!Number.isFinite(m) || m < 0 || m > 1440 || !Number.isFinite(l)) continue;
    const day = byDate.get(date) ?? {};
    day[pledgeId] = { minutes: Math.round(m), limit: Math.round(l), limitReached: limitReached === true, updatedAt: now };
    byDate.set(date, day);
  }
  try {
    await Promise.all([...byDate].map(([date, day]) => usageRef(uid).doc(date).set(day, { merge: true })));
  } catch (e) {
    console.warn("Could not save usage:", e);
  }
}
