import http2 from "node:http2";
import { createPrivateKey, sign } from "node:crypto";

/**
 * Minimal Apple Push client. We only send silent pushes, and we mostly care
 * about the answer: APNs reports a token as "Unregistered" once the app has
 * been deleted from the phone, which is how deletion is detected.
 */

export type PushResult =
  | { outcome: "delivered" }
  | { outcome: "unregistered"; since?: string }
  | { outcome: "unknown"; status?: number; reason?: string };

type Config = { keyId: string; teamId: string; privateKey: string; bundleId: string };

function config(): Config | undefined {
  const { APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8, APNS_BUNDLE_ID } = process.env;
  if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_KEY_P8) return undefined;
  const raw = APNS_KEY_P8.includes("BEGIN") ? APNS_KEY_P8 : Buffer.from(APNS_KEY_P8, "base64").toString("utf8");
  return {
    keyId: APNS_KEY_ID,
    teamId: APNS_TEAM_ID,
    privateKey: raw.replace(/\\n/g, "\n"),
    bundleId: APNS_BUNDLE_ID ?? "com.pledgecompany.pledge",
  };
}

export const apnsConfigured = () => !!config();

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

let cachedJwt: { token: string; issuedAt: number } | undefined;

/** ES256 provider token, reused for up to 50 minutes as Apple asks. */
function providerJwt(cfg: Config): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.issuedAt < 50 * 60) return cachedJwt.token;
  const header = b64url(JSON.stringify({ alg: "ES256", kid: cfg.keyId }));
  const claims = b64url(JSON.stringify({ iss: cfg.teamId, iat: now }));
  const signature = sign("sha256", Buffer.from(`${header}.${claims}`), {
    key: createPrivateKey(cfg.privateKey),
    dsaEncoding: "ieee-p1363",
  });
  const token = `${header}.${claims}.${b64url(signature)}`;
  cachedJwt = { token, issuedAt: now };
  return token;
}

function post(host: string, cfg: Config, deviceToken: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${host}`);
    const timer = setTimeout(() => {
      client.close();
      reject(new Error("APNs timeout"));
    }, 10_000);
    client.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${providerJwt(cfg)}`,
      "apns-topic": cfg.bundleId,
      "apns-push-type": "background",
      "apns-priority": "5",
      "content-type": "application/json",
    });
    let status = 0;
    let body = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      clearTimeout(timer);
      client.close();
      resolve({ status, body });
    });
    req.on("error", (e) => {
      clearTimeout(timer);
      client.close();
      reject(e);
    });
    req.end(JSON.stringify({ aps: { "content-available": 1 }, reason: "heartbeat" }));
  });
}

/**
 * Sends a silent push. Tries Apple's production gateway first and falls back
 * to the sandbox one, since development builds register sandbox tokens.
 */
export async function sendSilentPush(deviceToken: string): Promise<PushResult> {
  const cfg = config();
  if (!cfg) return { outcome: "unknown", reason: "APNs not configured" };

  let last: PushResult = { outcome: "unknown" };
  for (const host of ["api.push.apple.com", "api.sandbox.push.apple.com"]) {
    let res: { status: number; body: string };
    try {
      res = await post(host, cfg, deviceToken);
    } catch (e: any) {
      last = { outcome: "unknown", reason: e?.message };
      continue;
    }
    if (res.status === 200) return { outcome: "delivered" };
    let parsed: { reason?: string; timestamp?: number } = {};
    try {
      parsed = JSON.parse(res.body);
    } catch {}
    if (res.status === 410 || parsed.reason === "Unregistered") {
      return {
        outcome: "unregistered",
        since: parsed.timestamp ? new Date(parsed.timestamp).toISOString() : undefined,
      };
    }
    last = { outcome: "unknown", status: res.status, reason: parsed.reason };
    // A token from the other environment answers BadDeviceToken; try the next host.
    if (parsed.reason !== "BadDeviceToken") break;
  }
  return last;
}
