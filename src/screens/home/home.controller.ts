import * as DeviceActivity from "react-native-device-activity";
import { UIBlurEffectStyle } from "react-native-device-activity";
import type { DeviceActivityEvent } from "react-native-device-activity";
import { Pledge } from "../../types";
import {
  BREAK_MINUTES,
  BREAKS_PER_DAY,
  LEGACY_ACTIVITY_NAME,
  LIMIT_EVENT_NAME,
  MIN_GAP_BETWEEN_EVENTS_MS,
  RETRY_TICKS_AFTER_LIMIT,
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

// The shield extension expects 0-255 channel values. Same palette as the app.
const ink = { red: 23, green: 19, blue: 15 };
const cream = { red: 248, green: 244, blue: 236 };
const creamMuted = { red: 190, green: 182, blue: 170 };

const toThreshold = (totalMinutes: number) => ({
  hour: Math.floor(totalMinutes / 60),
  minute: totalMinutes % 60,
});

type ScheduleEvent = { name: string; minutes: number; blocks: boolean };

/**
 * The threshold events of one pledge's daily schedule, in order: a tick every
 * TICK_MINUTES below the limit (display only), the limit, then a few ticks
 * past it. The limit and the ticks past it block, each only if the event
 * before it fired earlier today (see MIN_GAP_BETWEEN_EVENTS_MS).
 */
function scheduleEvents(limit: number): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  for (let m = TICK_MINUTES; m < limit; m += TICK_MINUTES) {
    events.push({ name: `${TICK_EVENT_PREFIX}${m}`, minutes: m, blocks: false });
  }
  events.push({ name: LIMIT_EVENT_NAME, minutes: limit, blocks: true });
  for (let k = 1; k <= RETRY_TICKS_AFTER_LIMIT; k++) {
    const m = limit + k * TICK_MINUTES;
    events.push({ name: `${TICK_EVENT_PREFIX}${m}`, minutes: m, blocks: true });
  }
  return events;
}

const limitOf = (pledge: Pick<Pledge, "timeValue">) => Math.max(0, Math.round(pledge.timeValue));

/**
 * Stores the guarded block action on every blocking event of this pledge. The
 * monitor extension reads actions when an event fires, so calling this again
 * upgrades a schedule registered by an older build without restarting it.
 */
export function configureLimitActions(pledge: Pick<Pledge, "id" | "timeValue">) {
  const limit = limitOf(pledge);
  if (limit === 0) return;
  const { activityName, selectionId, shieldId } = pledgeNames(pledge.id);
  const events = scheduleEvents(limit);
  events.forEach((event, i) => {
    if (!event.blocks) return;
    const previous = events[i - 1];
    const action: any = { type: "blockSelection", familyActivitySelectionId: selectionId, shieldId };
    // Read by our patch of the monitor extension (patches/react-native-device-activity+*.patch).
    if (previous) {
      action.onlyIfEventRecordedEarlierToday = previous.name;
      action.onlyIfEventRecordedEarlierTodayMinGapMS = MIN_GAP_BETWEEN_EVENTS_MS;
    }
    DeviceActivity.configureActions({
      activityName,
      callbackName: "eventDidReachThreshold",
      eventName: event.name,
      actions: [action],
    });
  });
}

/**
 * Shield shown on top of an app blocked by this pledge. The secondary button
 * posts a notification that opens Pledge on the pay dialog for this pledge.
 */
export function shieldPayload(pledge: Pick<Pledge, "id" | "pledgeValue">): [any, any] {
  const { pledgeValue } = pledge;
  const configuration = {
    title: "That's enough for today.",
    subtitle: `You hit your limit. Unlocking costs your ${CURRENCY_SYMBOL}${pledgeValue} pledge.`,
    // iOS blends the colour with the blur material; the dark material keeps
    // it ink. The SF Symbol icon stays system-tinted (the library ignores iconTint).
    backgroundColor: ink,
    backgroundBlurStyle: UIBlurEffectStyle.systemMaterialDark,
    titleColor: cream,
    subtitleColor: creamMuted,
    iconSystemName: "lock.fill",
    primaryButtonLabel: "Keep my word",
    primaryButtonBackgroundColor: cream,
    primaryButtonLabelColor: ink,
    secondaryButtonLabel: `Unlock for ${CURRENCY_SYMBOL}${pledgeValue}`,
    secondaryButtonLabelColor: creamMuted,
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
  const limit = limitOf(pledge);
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
    configureLimitActions(pledge);
    for (const callbackName of ["intervalDidStart", "intervalDidEnd"] as const) {
      DeviceActivity.configureActions({
        activityName,
        callbackName,
        actions: [unblockAction],
      });
    }
    for (const event of scheduleEvents(limit)) {
      events.push({
        eventName: event.name,
        familyActivitySelection: token,
        threshold: toThreshold(event.minutes),
        includesPastActivity: true,
      });
    }
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
  const { activityName, selectionId, breakActivityName } = pledgeNames(id);
  try {
    DeviceActivity.stopMonitoring([activityName, breakActivityName]);
    DeviceActivity.cleanUpAfterActivity(activityName);
    DeviceActivity.cleanUpAfterActivity(breakActivityName);
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

/**
 * Blocks again every pledge already over its limit today. The device keeps one
 * blocklist for all pledges, so lifting one pledge's block also lifts any app
 * it shares with another; call this after ending a pledge, with the rest.
 */
export function reassertBlocks(pledges: Pledge[]) {
  for (const p of pledges) {
    try {
      if (!getTodayUsage(p.id, p.timeValue).limitReached || isOnBreak(p)) continue;
      DeviceActivity.blockSelection({ activitySelectionId: pledgeNames(p.id).selectionId }, "reassert");
    } catch (e) {
      console.warn("Could not re-block pledge:", p.id, e);
    }
  }
}

/** The phone's local date as YYYY-MM-DD; breaks are counted per local day. */
export function localDay(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function breaksLeftToday(p: Pledge): number {
  const taken = p.breaksDay === localDay() ? p.breaksToday ?? 0 : 0;
  return Math.max(0, BREAKS_PER_DAY - taken);
}

/** When a break started at `startedAt` locks the apps again. */
export const breakEndsAt = (startedAt: string) => new Date(startedAt).getTime() + BREAK_MINUTES * 60 * 1000;

/** A paid break whose 5 minutes are not over yet. */
export function isOnBreak(p: Pledge, now = Date.now()): boolean {
  return !!p.breakStartedAt && now < breakEndsAt(p.breakStartedAt);
}

/** Schedules may not be shorter than this, so a break's schedule is padded into the past. */
const MIN_SCHEDULE_MINUTES = 15;

const clock = (d: Date) => ({ hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() });

/**
 * Lifts this pledge's block for BREAK_MINUTES on the clock. Screen Time will
 * not schedule anything shorter than 15 minutes, so the break's schedule
 * starts 10 minutes in the past and ends BREAK_MINUTES from now: iOS starts
 * it at once (now is inside it) and when it ends the monitor extension blocks
 * the apps again, even with Pledge closed.
 */
export async function startBreak(pledge: Pledge, startedAt = new Date()) {
  const { breakActivityName, selectionId, shieldId } = pledgeNames(pledge.id);
  const end = new Date(breakEndsAt(startedAt.toISOString()));
  const start = new Date(end.getTime() - MIN_SCHEDULE_MINUTES * 60 * 1000);

  try {
    DeviceActivity.stopMonitoring([breakActivityName]);
  } catch {}
  DeviceActivity.cleanUpAfterActivity(breakActivityName);

  // A break running past midnight needs no re-block: the daily reset unblocks
  // the apps at midnight anyway, and blocking after it would cut into the new
  // day's allowance.
  if (localDay(end) === localDay(startedAt)) {
    DeviceActivity.configureActions({
      activityName: breakActivityName,
      callbackName: "intervalDidEnd",
      actions: [{ type: "blockSelection", familyActivitySelectionId: selectionId, shieldId }],
    });
    await DeviceActivity.startMonitoring(
      breakActivityName,
      { intervalStart: clock(start), intervalEnd: clock(end), repeats: false },
      []
    );
  }
  DeviceActivity.unblockSelection({ activitySelectionId: selectionId }, "break");
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

/** When each threshold event of this pledge last fired, keeping only today's. */
function eventsFiredToday(id: string): Map<string, number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const fired = new Map<string, number>();
  for (const event of DeviceActivity.getEvents(pledgeNames(id).activityName)) {
    if (event.callbackName !== "eventDidReachThreshold" || !event.eventName) continue;
    if (event.lastCalledAt < startOfDay) continue;
    fired.set(event.eventName, event.lastCalledAt.getTime());
  }
  return fired;
}

/** Today's threshold events in the order they fired, for the debug readout. */
export function todayEventLog(id: string): { name: string; at: Date }[] {
  return [...eventsFiredToday(id)]
    .map(([name, at]) => ({ name, at: new Date(at) }))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * Today's use and whether the limit really was reached, from the events the
 * monitor extension recorded. Same rule as the extension's guard: a blocking
 * event counts only if the event before it fired at least
 * MIN_GAP_BETWEEN_EVENTS_MS earlier. Used minutes come from the ticks, not
 * from the limit, so an early limit event cannot claim time that was not used.
 */
export function getTodayUsage(id: string, limitMinutes: number): DailyUsage {
  const limit = Math.max(0, Math.round(limitMinutes));
  if (limit <= 0) {
    return { usedMinutes: 0, remainingMinutes: 0, limitReached: true };
  }
  const fired = eventsFiredToday(id);

  let usedMinutes = 0;
  for (const name of fired.keys()) {
    if (!name.startsWith(TICK_EVENT_PREFIX)) continue;
    const minutes = parseInt(name.slice(TICK_EVENT_PREFIX.length), 10);
    if (!Number.isNaN(minutes)) usedMinutes = Math.max(usedMinutes, minutes);
  }

  const events = scheduleEvents(limit);
  const limitReached = events.some((event, i) => {
    if (!event.blocks) return false;
    const at = fired.get(event.name);
    if (at === undefined) return false;
    const previous = events[i - 1];
    if (!previous) return true;
    const previousAt = fired.get(previous.name);
    return previousAt !== undefined && at - previousAt >= MIN_GAP_BETWEEN_EVENTS_MS;
  });
  if (limitReached) usedMinutes = Math.max(usedMinutes, limit);

  return {
    usedMinutes,
    remainingMinutes: Math.max(0, limit - usedMinutes),
    limitReached,
  };
}

export const splitMinutes = (total: number) => ({
  hours: Math.floor(total / 60),
  minutes: total % 60,
});
