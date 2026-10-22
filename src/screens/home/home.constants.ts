// Names must not contain underscores: the library encodes events as
// `events_{activity}_{callback}_{eventName}` and splits on "_" when reading back.
export const DAILY_ACTIVITY_NAME = "PledgeDaily";
export const TICK_EVENT_PREFIX = "tick";
export const LIMIT_EVENT_NAME = "limitReached";
export const TICK_MINUTES = 5;

export const pledgeActivitySelectionId = "pledgeActivitySelection";
export const pledgeShieldId = "pledgeShield";

export const CHALLENGE_DURATION = 30;

// Deep link the shield button opens. Scheme is declared in app.json.
export const UNLOCK_URL = "pledge://unlock";
