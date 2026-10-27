import { db, devicesRef, getUser, pledgesRef, type DeviceRecord, type ForfeitReason, type PledgeRecord } from "./firebase.js";
import { chargePledge } from "./stripe.js";
import { sendSilentPush } from "./apns.js";

/**
 * Forfeits every active pledge of a user: charges each one and marks it.
 * A failed charge leaves the pledge active with the error recorded, so the
 * next run (or the next heartbeat) tries again.
 */
export async function forfeitActivePledges(uid: string, reason: ForfeitReason): Promise<string[]> {
  const user = await getUser(uid);
  if (!user) return [];
  const snap = await pledgesRef(uid).where("status", "==", "active").get();
  const forfeited: string[] = [];
  for (const doc of snap.docs) {
    const pledge = { id: doc.id, ...doc.data() } as PledgeRecord;
    try {
      const outcome = await chargePledge(user, pledge, { status: "forfeited", reason });
      if (outcome.status === "succeeded" || outcome.status === "processing") {
        forfeited.push(pledge.id);
      } else {
        await doc.ref.set({ chargeError: outcome.status, forfeitReason: reason }, { merge: true });
      }
    } catch (e: any) {
      console.error(`Forfeit charge failed for ${uid}/${pledge.id}:`, e?.message);
      await doc.ref.set({ chargeError: e?.message ?? "error", forfeitReason: reason }, { merge: true });
    }
  }
  return forfeited;
}

export type DeviceCheckReport = {
  usersChecked: number;
  devicesPinged: number;
  unregistered: number;
  forfeitedPledges: number;
  skipped: string[];
};

/**
 * Daily job. For every user with an active pledge, pings each registered
 * device. When Apple reports every device of that user as unregistered, the
 * app was deleted, and the user's pledges are forfeited.
 */
export async function checkDevices(): Promise<DeviceCheckReport> {
  const report: DeviceCheckReport = {
    usersChecked: 0,
    devicesPinged: 0,
    unregistered: 0,
    forfeitedPledges: 0,
    skipped: [],
  };

  const active = await db().collectionGroup("pledges").where("status", "==", "active").get();
  const uids = new Set<string>();
  for (const doc of active.docs) {
    const uid = doc.ref.parent.parent?.id;
    if (uid) uids.add(uid);
  }

  for (const uid of uids) {
    report.usersChecked++;
    const devices = (await devicesRef(uid).get()).docs.map((d) => d.data() as DeviceRecord);
    const live = devices.filter((d) => !d.unregisteredAt);
    if (live.length === 0) {
      // Nothing to ping: an old build without push, or already handled.
      if (devices.length === 0) report.skipped.push(`${uid}: no device registered`);
      continue;
    }

    let stillInstalled = false;
    let undecided = false;
    for (const device of live) {
      report.devicesPinged++;
      const result = await sendSilentPush(device.token);
      if (result.outcome === "delivered") {
        stillInstalled = true;
      } else if (result.outcome === "unregistered") {
        report.unregistered++;
        await devicesRef(uid)
          .doc(device.token)
          .set({ unregisteredAt: result.since ?? new Date().toISOString() }, { merge: true });
      } else {
        undecided = true;
        report.skipped.push(`${uid}: ${result.reason ?? result.status ?? "unknown"}`);
      }
    }

    if (!stillInstalled && !undecided) {
      const forfeited = await forfeitActivePledges(uid, "app_deleted");
      report.forfeitedPledges += forfeited.length;
    }
  }

  return report;
}
