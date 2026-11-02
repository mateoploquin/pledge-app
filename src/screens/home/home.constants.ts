// Names must not contain underscores: the library encodes events as
// `events_{activity}_{callback}_{eventName}` and splits on "_" when reading back.
export const TICK_EVENT_PREFIX = "tick";
export const LIMIT_EVENT_NAME = "limitReached";
export const TICK_MINUTES = 5;

/** A paid break: this many minutes on the clock, for this many dollars, this many times a day per pledge. */
export const BREAK_MINUTES = 5;
export const BREAK_PRICE = 1;
export const BREAKS_PER_DAY = 3;

/** Default pledge length in days. */
export const CHALLENGE_DURATION = 30;

/** Schedule, selection and shield names for one pledge. */
export const pledgeNames = (id: string) => ({
  activityName: `Pledge${id}`,
  selectionId: `sel${id}`,
  shieldId: `shield${id}`,
  /** A one-off schedule whose end blocks again after a paid break. */
  breakActivityName: `Break${id}`,
});

/** Schedule name used by the single-pledge version of the app. */
export const LEGACY_ACTIVITY_NAME = "PledgeDaily";

// Deep link the shield button opens. Scheme is declared in app.json.
export const UNLOCK_URL = "pledge://unlock";
