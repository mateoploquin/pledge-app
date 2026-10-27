import { requireNativeViewManager } from "expo-modules-core";
import React, { useMemo } from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";

/** Which window of Screen Time to show. */
export type ReportRange = "today" | "yesterday" | "week";

type NativeProps = {
  context: "totalActivity" | "topApps";
  startMs: number;
  endMs: number;
  segment: "hourly" | "daily" | "weekly";
  familyActivitySelection?: string | null;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  fontSize?: number;
  maxApps?: number;
  style?: StyleProp<ViewStyle>;
};

let NativeReport: React.ComponentType<NativeProps> | null = null;
if (Platform.OS === "ios") {
  try {
    NativeReport = requireNativeViewManager("PledgeActivityReport");
  } catch {
    NativeReport = null;
  }
}

/** False on builds without the ReportExtension (older dev clients). */
export const isActivityReportAvailable = () => NativeReport !== null;

/** Height of one row drawn by the extension's TopAppsView. Keep in sync. */
export const TOP_APPS_ROW_HEIGHT = 52;

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Converts a named range into the interval Apple's filter expects. */
export function rangeToInterval(range: ReportRange, now = Date.now()) {
  const today = startOfDay(now);
  switch (range) {
    case "yesterday":
      return { startMs: today - DAY, endMs: today, segment: "daily" as const };
    case "week":
      return { startMs: today - 6 * DAY, endMs: now, segment: "daily" as const };
    default:
      return { startMs: today, endMs: now, segment: "daily" as const };
  }
}

type CommonProps = {
  range?: ReportRange;
  /** Base64 FamilyActivitySelection to restrict the report to (optional). */
  familyActivitySelection?: string | null;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The total time as one number, e.g. "4h 12m". Drawn by the system from the
 * user's real Screen Time; our code never sees the value. Give it a height.
 */
export const TotalScreenTime: React.FC<CommonProps & { fontSize?: number }> = ({
  range = "today",
  familyActivitySelection,
  textColor,
  mutedColor,
  accentColor,
  fontSize = 44,
  style,
}) => {
  const interval = useMemo(() => rangeToInterval(range), [range]);
  if (!NativeReport) return React.createElement(View, { style });
  return React.createElement(NativeReport, {
    context: "totalActivity",
    ...interval,
    familyActivitySelection,
    textColor,
    mutedColor,
    accentColor,
    fontSize,
    style,
  });
};

/** The apps that took the most time, icon + name + duration + bar. */
export const TopApps: React.FC<CommonProps & { maxApps?: number }> = ({
  range = "today",
  familyActivitySelection,
  textColor,
  mutedColor,
  accentColor,
  maxApps = 5,
  style,
}) => {
  const interval = useMemo(() => rangeToInterval(range), [range]);
  const height = maxApps * TOP_APPS_ROW_HEIGHT;
  if (!NativeReport) return React.createElement(View, { style: [{ height }, style] });
  return React.createElement(NativeReport, {
    context: "topApps",
    ...interval,
    familyActivitySelection,
    textColor,
    mutedColor,
    accentColor,
    maxApps,
    style: [{ height }, style],
  });
};
