import * as DeviceActivity from "react-native-device-activity";
import type { DeviceActivityEvent } from "react-native-device-activity";
import { PledgeSettings } from "../../types";
import {
  DAILY_ACTIVITY_NAME,
  LIMIT_EVENT_NAME,
  TICK_EVENT_PREFIX,
  TICK_MINUTES,
  pledgeActivitySelectionId,
  pledgeShieldId,
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
 * Shield shown on top of a blocked app. The primary button deep-links back into
 * Pledge where the user can pay the pledge to unlock (= surrender).
 */
export function shieldPayload(pledgeValue: number): [any, any] {
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
  // Primary (prominent) button is the healthy choice. Shield extensions are
  // not allowed to launch other apps, so the unlock button posts a local
  // notification; tapping it opens Pledge on the pay dialog (see Home).
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
        identifier: "pledge-unlock",
        userInfo: { action: UNLOCK_ACTION, url: UNLOCK_URL },
      },
    } as any,
  };

  return [configuration, actions];
}

export function configureShield(pledgeValue: number) {
  const [configuration, actions] = shieldPayload(pledgeValue);
  // Stored under the shield id so the monitor extension can activate it when
  // the limit event fires, and also set as the active shield right away.
  DeviceActivity.updateShieldWithId(configuration, actions, pledgeShieldId);
  DeviceActivity.updateShield(configuration, actions, "pledge");
}

/**
 * Registers a repeating daily DeviceActivity schedule for the selected apps.
 *
 * - tick events every TICK_MINUTES feed the "daily consumption" display
 * - LIMIT_EVENT_NAME fires at the daily limit and the monitor extension blocks
 *   the selection (runs even when the app is closed)
 * - at the start of each day the block is lifted again
 */
export async function startChallengeMonitoring(
  settings: PledgeSettings,
  options: { fresh?: boolean } = {}
) {
  const token = settings.selectionEvent?.familyActivitySelection;
  if (!token) {
    throw new Error("No apps selected for this pledge");
  }
  const limit = Math.max(0, Math.round(settings.timeValue));
  const fullBlock = limit === 0;

  DeviceActivity.setFamilyActivitySelectionId({
    id: pledgeActivitySelectionId,
    familyActivitySelection: token,
  });
  configureShield(settings.pledgeValue);
  await ensureNotificationPermission();

  if (options.fresh) {
    DeviceActivity.cleanUpAfterActivity(DAILY_ACTIVITY_NAME);
    DeviceActivity.resetBlocks("newChallenge");
  }

  const blockAction = {
    type: "blockSelection" as const,
    familyActivitySelectionId: pledgeActivitySelectionId,
    shieldId: pledgeShieldId,
  };
  const unblockAction = {
    type: "unblockSelection" as const,
    familyActivitySelectionId: pledgeActivitySelectionId,
  };

  const events: DeviceActivityEvent[] = [];

  if (fullBlock) {
    // No allowance: block now and re-assert the block at the start of every day.
    DeviceActivity.configureActions({
      activityName: DAILY_ACTIVITY_NAME,
      callbackName: "intervalDidStart",
      actions: [blockAction],
    });
    DeviceActivity.configureActions({
      activityName: DAILY_ACTIVITY_NAME,
      callbackName: "intervalDidEnd",
      actions: [],
    });
    DeviceActivity.updateShield(
      ...shieldPayload(settings.pledgeValue),
      "fullBlock"
    );
    DeviceActivity.blockSelection({ activitySelectionId: pledgeActivitySelectionId }, "fullBlock");
  } else {
    DeviceActivity.configureActions({
      activityName: DAILY_ACTIVITY_NAME,
      callbackName: "eventDidReachThreshold",
      eventName: LIMIT_EVENT_NAME,
      actions: [blockAction],
    });
    for (const callbackName of ["intervalDidStart", "intervalDidEnd"] as const) {
      DeviceActivity.configureActions({
        activityName: DAILY_ACTIVITY_NAME,
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
    DAILY_ACTIVITY_NAME,
    {
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
    },
    events
  );
}

export function isChallengeMonitoring(): boolean {
  try {
    return DeviceActivity.getActivities().includes(DAILY_ACTIVITY_NAME);
  } catch {
    return false;
  }
}

/** Stops the schedule, forgets recorded events and lifts any block. */
export function stopChallengeMonitoring() {
  try {
    DeviceActivity.stopMonitoring([DAILY_ACTIVITY_NAME]);
    DeviceActivity.cleanUpAfterActivity(DAILY_ACTIVITY_NAME);
  } finally {
    DeviceActivity.resetBlocks("challengeEnded");
  }
}

/** Reads today's threshold events recorded by the monitor extension. */
export function getTodayUsage(limitMinutes: number): DailyUsage {
  if (limitMinutes <= 0) {
    return { usedMinutes: 0, remainingMinutes: 0, limitReached: true };
  }
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let usedMinutes = 0;
  let limitReached = false;

  if (__DEV__) {
    const all = DeviceActivity.getEvents();
    console.log(
      "[usage] activities:", JSON.stringify(DeviceActivity.getActivities()),
      "| events:", JSON.stringify(all.map((e) => `${e.activityName}/${e.callbackName}/${e.eventName}@${e.lastCalledAt.toISOString()}`))
    );
  }

  for (const event of DeviceActivity.getEvents(DAILY_ACTIVITY_NAME)) {
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

export function isShieldActive(): boolean {
  try {
    return DeviceActivity.isShieldActive();
  } catch {
    return false;
  }
}

export const splitMinutes = (total: number) => ({
  hours: Math.floor(total / 60),
  minutes: total % 60,
});
