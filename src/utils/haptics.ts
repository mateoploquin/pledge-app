// Haptic feedback that degrades silently when the native module is absent
// (older dev builds) or on platforms without a Taptic Engine.
let Haptics: typeof import("expo-haptics") | null = null;
try {
  Haptics = require("expo-haptics");
} catch {
  Haptics = null;
}

const safe = (fn: () => Promise<void> | void) => {
  try {
    const r = fn();
    if (r && typeof (r as Promise<void>).catch === "function") {
      (r as Promise<void>).catch(() => {});
    }
  } catch {
    /* no haptics available */
  }
};

export const haptics = {
  /** Soft tick for ordinary taps. */
  tap: () => safe(() => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Slightly firmer, for primary actions. */
  press: () => safe(() => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Tick while dragging a slider between values. */
  select: () => safe(() => Haptics?.selectionAsync()),
  success: () =>
    safe(() => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () =>
    safe(() => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () =>
    safe(() => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
