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
  pledgeValue?: number;
  timeValue?: number;
  durationDays?: number;
  pledgeSetAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

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
