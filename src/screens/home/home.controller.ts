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

export type DailyUsage = {
  usedMinutes: number;
  remainingMinutes: number;
  limitReached: boolean;
};

const white = { red: 1, green: 1, blue: 1 };
const orange = { red: 0.95, green: 0.45, blue: 0.1 };

const toThreshold = (totalMinutes: number) => ({
  hour: Math.floor(totalMinutes / 60),
  minute: totalMinutes % 60,
});

/**
 * Shield shown on top of a blocked app. The primary button deep-links back into
 * Pledge where the user can pay the pledge to unlock (= surrender).
 */
export function configureShield(pledgeValue: number) {
  const configuration = {
    title: "Blocked by Pledge",
    subtitle: `You hit today's limit. Unlocking costs your ${CURRENCY_SYMBOL}${pledgeValue} pledge.`,
    backgroundBlurStyle: DeviceActivity.UIBlurEffectStyle.systemMaterialDark,
    titleColor: white,
    subtitleColor: white,
    iconSystemName: "lock.fill",
    iconTint: orange,
    primaryButtonLabel: "Open Pledge to unlock",
    primaryButtonBackgroundColor: orange,
    primaryButtonLabelColor: white,
    secondaryButtonLabel: "Stay strong",
    secondaryButtonLabelColor: white,
  };
  const actions = {
    // "openUrl" is handled by the ShieldAction extension even though the TS
    // union only lists "openApp".
    primary: { type: "openUrl", url: UNLOCK_URL, behavior: "close" } as any,
    secondary: { type: "dismiss", behavior: "close" } as any,
  };

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
  const limit = Math.max(TICK_MINUTES, Math.round(settings.timeValue));

  DeviceActivity.setFamilyActivitySelectionId({
    id: pledgeActivitySelectionId,
    familyActivitySelection: token,
  });
  configureShield(settings.pledgeValue);

  if (options.fresh) {
    DeviceActivity.cleanUpAfterActivity(DAILY_ACTIVITY_NAME);
    DeviceActivity.resetBlocks("newChallenge");
  }

  DeviceActivity.configureActions({
    activityName: DAILY_ACTIVITY_NAME,
    callbackName: "eventDidReachThreshold",
    eventName: LIMIT_EVENT_NAME,
    actions: [
      {
        type: "blockSelection",
        familyActivitySelectionId: pledgeActivitySelectionId,
        shieldId: pledgeShieldId,
      },
    ],
  });
  for (const callbackName of ["intervalDidStart", "intervalDidEnd"] as const) {
    DeviceActivity.configureActions({
      activityName: DAILY_ACTIVITY_NAME,
      callbackName,
      actions: [
        {
          type: "unblockSelection",
          familyActivitySelectionId: pledgeActivitySelectionId,
        },
      ],
    });
  }

  const events: DeviceActivityEvent[] = [];
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
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let usedMinutes = 0;
  let limitReached = false;

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
