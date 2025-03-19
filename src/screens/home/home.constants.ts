export const initialMinutes = 5;
export const postponeMinutes = 5;

export const potentialMaxEvents = Math.floor(
  (60 * 24 - initialMinutes) / postponeMinutes
);

export const monitoringEventName = "GeneralMonitoring";
export const eventNameTick = "minutes_reached";
export const eventNameFinish = "tresholdReached";
export const pledgeActivitySelectionId = "pledgeActivitySelection";
export const pledgeShieldId = "pledgeShield";
export const CHALLENGE_DURATION = 30;
