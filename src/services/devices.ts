import axios from "axios";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { getAuthorizationStatus, AuthorizationStatus } from "react-native-device-activity";
import { API_URL } from "../config";
import { auth } from "../firebaseConfig";

/**
 * Deletion and revocation detection.
 *
 * - The phone's Apple push token is registered with the backend. Apple reports
 *   that token as unregistered once Pledge is deleted; the backend pings it
 *   daily and forfeits the user's pledges when every device is gone.
 * - A heartbeat reports whether Screen Time access is still granted. Turning
 *   it off while a pledge runs forfeits the pledge, under the terms.
 */

const BACKGROUND_TASK = "pledge-heartbeat";

const authHeaders = async () => {
  const user = auth.currentUser;
  if (!user) return undefined;
  return { Authorization: `Bearer ${await user.getIdToken()}` };
};

export const isScreenTimeAuthorized = () => {
  try {
    return getAuthorizationStatus() === AuthorizationStatus.approved;
  } catch {
    return false;
  }
};

/** Sends the Apple push token to the backend. Safe to call often. */
export async function registerDevice(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    const headers = await authHeaders();
    if (!headers) return;
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (typeof token !== "string") return;
    await axios.post(`${API_URL}/device`, { token }, { headers });
  } catch (e) {
    console.warn("Device registration failed:", e);
  }
}

export type HeartbeatResult = { forfeited: string[]; active: string[] } | undefined;

/** Reports in. Returns the ids the backend forfeited, if any. */
export async function sendHeartbeat(): Promise<HeartbeatResult> {
  try {
    const headers = await authHeaders();
    if (!headers) return undefined;
    const { data } = await axios.post(
      `${API_URL}/heartbeat`,
      { screenTimeAuthorized: isScreenTimeAuthorized() },
      { headers }
    );
    return { forfeited: data?.forfeited ?? [], active: data?.active ?? [] };
  } catch (e) {
    console.warn("Heartbeat failed:", e);
    return undefined;
  }
}

// Silent pushes wake the app briefly in the background; use that to report in,
// so a revoked Screen Time permission is noticed even if the app is never opened.
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  await sendHeartbeat();
});

export async function enableBackgroundHeartbeat(): Promise<void> {
  if (Platform.OS !== "ios") return;
  try {
    await Notifications.registerTaskAsync(BACKGROUND_TASK);
  } catch (e) {
    console.warn("Background heartbeat not available:", e);
  }
}
