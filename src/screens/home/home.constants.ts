// Names must not contain underscores: the library encodes events as
// `events_{activity}_{callback}_{eventName}` and splits on "_" when reading back.
export const TICK_EVENT_PREFIX = "tick";
export const LIMIT_EVENT_NAME = "limitReached";
export const TICK_MINUTES = 5;

/** Default pledge length in days. */
export const CHALLENGE_DURATION = 30;

/** Schedule, selection and shield names for one pledge. */
export const pledgeNames = (id: string) => ({
  activityName: `Pledge${id}`,
  selectionId: `sel${id}`,
  shieldId: `shield${id}`,
});

/** Schedule name used by the single-pledge version of the app. */
export const LEGACY_ACTIVITY_NAME = "PledgeDaily";

// Deep link the shield button opens. Scheme is declared in app.json.
export const UNLOCK_URL = "pledge://unlock";
