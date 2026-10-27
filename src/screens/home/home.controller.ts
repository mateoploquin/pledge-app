import * as DeviceActivity from "react-native-device-activity";
import type { DeviceActivityEvent } from "react-native-device-activity";
import { Pledge } from "../../types";
import {
  LEGACY_ACTIVITY_NAME,
  LIMIT_EVENT_NAME,
  TICK_EVENT_PREFIX,
  TICK_MINUTES,
  pledgeNames,
  UNLOCK_URL,
} from "./home.constants";
import { CURRENCY_SYMBOL } from "../../config";
import * as Notifications from "expo-notifications";

export const UNLOCK_ACTION = "unlock";

/** Needed so the shield's "Unlock" button can reach the user via a notification. */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch (e) {
    console.warn("Notification permission check failed:", e);
    return false;
  }
}

export type DailyUsage = {
  usedMinutes: number;
  remainingMinutes: number;
  limitReached: boolean;
};

// The shield extension expects 0-255 channel values.
const white = { red: 255, green: 255, blue: 255 };
const orange = { red: 255, green: 89, blue: 0 };
const ink = { red: 28, green: 20, blue: 16 };
const inkSoft = { red: 90, green: 70, blue: 60 };

const toThreshold = (totalMinutes: number) => ({
  hour: Math.floor(totalMinutes / 60),
  minute: totalMinutes % 60,
});

/**
 * Shield shown on top of an app blocked by this pledge. The secondary button
 * posts a notification that opens Pledge on the pay dialog for this pledge.
 */
export function shieldPayload(pledge: Pick<Pledge, "id" | "pledgeValue">): [any, any] {
  const { pledgeValue } = pledge;
  const configuration = {
    title: "Blocked by Pledge",
    subtitle: `You hit today's limit. Unlocking costs your ${CURRENCY_SYMBOL}${pledgeValue} pledge.`,
    // iOS blends this with a translucent material, so orange renders as a warm
    // peach wash. Dark text reads on it; the SF Symbol icon stays system-black
    // (the library ignores iconTint).
    backgroundColor: orange,
    titleColor: ink,
    subtitleColor: inkSoft,
    iconSystemName: "lock.fill",
    primaryButtonLabel: "Stay strong",
    primaryButtonBackgroundColor: orange,
    primaryButtonLabelColor: white,
    secondaryButtonLabel: `Unlock for ${CURRENCY_SYMBOL}${pledgeValue}`,
    secondaryButtonLabelColor: orange,
  };
  // Shield extensions are not allowed to launch other apps, so the unlock
  // button posts a local notification; tapping it opens Pledge (see Home).
  const actions = {
    primary: { type: "dismiss", behavior: "close" } as any,
    secondary: {
      type: "sendNotification",
      behavior: "close",
      payload: {
        title: "Unlock your apps?",
        body: `Tap to open Pledge and pay your ${CURRENCY_SYMBOL}${pledgeValue} pledge to unlock.`,
        sound: "default",
        interruptionLevel: "timeSensitive",
        identifier: `pledge-unlock-${pledge.id}`,
        userInfo: { action: UNLOCK_ACTION, url: UNLOCK_URL, pledgeId: pledge.id },
      },
    } as any,
  };

  return [configuration, actions];
}

/**
 * Stores the shield for this pledge under its shield id (used by the block
 * action in the monitor extension) and under its selection id (what the shield
 * extensions look up for an app in that selection).
 */
export function configureShield(pledge: Pick<Pledge, "id" | "pledgeValue">) {
  const [configuration, actions] = shieldPayload(pledge);
  const { shieldId, selectionId } = pledgeNames(pledge.id);
  const stamp = { shieldId, updatedAt: new Date().toISOString() };
  DeviceActivity.updateShieldWithId(configuration, actions, shieldId);
  DeviceActivity.userDefaultsSet(`shieldConfigurationForSelection_${selectionId}`, {
    ...configuration,
    ...stamp,
  });
  DeviceActivity.userDefaultsSet(`shieldActionsForSelection_${selectionId}`, {
    ...actions,
    ...stamp,
  });
  // Fallback for anything blocked outside a known selection.
  DeviceActivity.updateShield(configuration, actions, "pledge");
}

/**
 * Registers a repeating daily DeviceActivity schedule for one pledge.
 *
 * - tick events every TICK_MINUTES feed the "daily consumption" display
 * - LIMIT_EVENT_NAME fires at the daily limit and the monitor extension blocks
 *   the selection (runs even when the app is closed)
 * - at the start of each day the block is lifted again
 */
export async function startPledgeMonitoring(
  pledge: Pledge,
  options: { fresh?: boolean } = {}
) {
  const token = pledge.selectionEvent?.familyActivitySelection;
  if (!token) {
    throw new Error("No apps selected for this pledge");
  }
  const { activityName, selectionId, shieldId } = pledgeNames(pledge.id);
  const limit = Math.max(0, Math.round(pledge.timeValue));
  const fullBlock = limit === 0;

  DeviceActivity.setFamilyActivitySelectionId({
    id: selectionId,
    familyActivitySelection: token,
  });
  configureShield(pledge);
  await ensureNotificationPermission();

  if (options.fresh) {
    DeviceActivity.cleanUpAfterActivity(activityName);
  }

  const blockAction = {
    type: "blockSelection" as const,
    familyActivitySelectionId: selectionId,
    shieldId,
  };
  const unblockAction = {
    type: "unblockSelection" as const,
    familyActivitySelectionId: selectionId,
  };

  const events: DeviceActivityEvent[] = [];

  if (fullBlock) {
    // No allowance: block now and re-assert the block at the start of every day.
    DeviceActivity.configureActions({
      activityName,
      callbackName: "intervalDidStart",
      actions: [blockAction],
    });
    DeviceActivity.configureActions({
      activityName,
      callbackName: "intervalDidEnd",
      actions: [],
    });
    DeviceActivity.blockSelection({ activitySelectionId: selectionId }, "fullBlock");
  } else {
    DeviceActivity.configureActions({
      activityName,
      callbackName: "eventDidReachThreshold",
      eventName: LIMIT_EVENT_NAME,
      actions: [blockAction],
    });
    for (const callbackName of ["intervalDidStart", "intervalDidEnd"] as const) {
      DeviceActivity.configureActions({
        activityName,
        callbackName,
        actions: [unblockAction],
      });
    }
    for (let m = TICK_MINUTES; m < limit; m += TICK_MINUTES) {
      events.push({
        eventName: `${TICK_EVENT_PREFIX}${m}`,
        familyActivitySelection: token,
        threshold: toThreshold(m),
        includesPastActivity: true,
      });
    }
    events.push({
      eventName: LIMIT_EVENT_NAME,
      familyActivitySelection: token,
      threshold: toThreshold(limit),
      includesPastActivity: true,
    });
  }

  await DeviceActivity.startMonitoring(
    activityName,
    {
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
    },
    events
  );
}

export function isPledgeMonitoring(id: string): boolean {
  try {
    return DeviceActivity.getActivities().includes(pledgeNames(id).activityName);
  } catch {
    return false;
  }
}

/** Stops this pledge's schedule, forgets its events and lifts its block only. */
export function stopPledgeMonitoring(id: string) {
  const { activityName, selectionId } = pledgeNames(id);
  try {
    DeviceActivity.stopMonitoring([activityName]);
    DeviceActivity.cleanUpAfterActivity(activityName);
  } finally {
    try {
      DeviceActivity.unblockSelection({ activitySelectionId: selectionId }, "pledgeEnded");
    } catch (e) {
      console.warn("Could not unblock selection:", e);
    }
    DeviceActivity.userDefaultsRemove(`shieldConfigurationForSelection_${selectionId}`);
    DeviceActivity.userDefaultsRemove(`shieldActionsForSelection_${selectionId}`);
  }
}

/** Removes the schedule and blocks left by the single-pledge version of the app. */
export function stopLegacyMonitoring() {
  try {
    if (DeviceActivity.getActivities().includes(LEGACY_ACTIVITY_NAME)) {
      DeviceActivity.stopMonitoring([LEGACY_ACTIVITY_NAME]);
    }
    DeviceActivity.cleanUpAfterActivity(LEGACY_ACTIVITY_NAME);
    DeviceActivity.resetBlocks("legacyMigration");
  } catch (e) {
    console.warn("Could not stop legacy monitoring:", e);
  }
}

/** Reads today's threshold events recorded by the monitor extension for one pledge. */
export function getTodayUsage(id: string, limitMinutes: number): DailyUsage {
  if (limitMinutes <= 0) {
    return { usedMinutes: 0, remainingMinutes: 0, limitReached: true };
  }
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let usedMinutes = 0;
  let limitReached = false;

  for (const event of DeviceActivity.getEvents(pledgeNames(id).activityName)) {
    if (event.callbackName !== "eventDidReachThreshold") continue;
    if (event.lastCalledAt < startOfDay) continue;

    if (event.eventName === LIMIT_EVENT_NAME) {
      limitReached = true;
      usedMinutes = Math.max(usedMinutes, limitMinutes);
    } else if (event.eventName?.startsWith(TICK_EVENT_PREFIX)) {
      const minutes = parseInt(event.eventName.slice(TICK_EVENT_PREFIX.length), 10);
      if (!Number.isNaN(minutes)) usedMinutes = Math.max(usedMinutes, minutes);
    }
  }

  return {
    usedMinutes,
    remainingMinutes: Math.max(0, limitMinutes - usedMinutes),
    limitReached,
  };
}

export const splitMinutes = (total: number) => ({
  hours: Math.floor(total / 60),
  minutes: total % 60,
});
