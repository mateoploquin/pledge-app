import { requireNativeModule, requireNativeViewManager } from "expo-modules-core";
import React, { useMemo } from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";

/** Which window of Screen Time to show. */
export type ReportRange = "today" | "yesterday" | "week";

type NativeProps = {
  context: "totalActivity" | "topApps" | "overview" | "socialCut" | "recovered";
  startMs: number;
  endMs: number;
  segment: "hourly" | "daily" | "weekly";
  familyActivitySelection?: string | null;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  fontSize?: number;
  maxApps?: number;
  anchorMs?: number;
  familyActivitySelections?: string[];
  style?: StyleProp<ViewStyle>;
};

let NativeReport: React.ComponentType<NativeProps> | null = null;
let extensionBundled = false;
if (Platform.OS === "ios") {
  try {
    NativeReport = requireNativeViewManager("PledgeActivityReport");
    extensionBundled = requireNativeModule("PledgeActivityReport").isExtensionBundled();
  } catch {
    NativeReport = null;
  }
}

/**
 * False on builds without the ReportExtension: older dev clients, and store
 * builds made while Apple reviews the extension's Family Controls approval
 * (see docs/release.md). Every Screen Time panel is hidden then.
 */
export const isActivityReportAvailable = () => NativeReport !== null && extensionBundled;

/** Height of one row drawn by the extension's TopAppsView. Keep in sync. */
export const TOP_APPS_ROW_HEIGHT = 52;
/** Space between the total and the rows in the extension's OverviewView. */
export const OVERVIEW_GAP = 16;

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

/**
 * The total and the top apps in one system-drawn view. Prefer this over
 * TotalScreenTime + TopApps on the same screen: one report instance is
 * reliable, two share an extension process and the second can come up blank.
 */
export const ScreenTimeOverview: React.FC<CommonProps & { fontSize?: number; maxApps?: number }> = ({
  range = "today",
  familyActivitySelection,
  textColor,
  mutedColor,
  accentColor,
  fontSize = 44,
  maxApps = 3,
  style,
}) => {
  const interval = useMemo(() => rangeToInterval(range), [range]);
  const height = Math.round(fontSize * 1.25) + OVERVIEW_GAP + maxApps * TOP_APPS_ROW_HEIGHT;
  if (!NativeReport) return React.createElement(View, { style: [{ height }, style] });
  return React.createElement(NativeReport, {
    context: "overview",
    ...interval,
    familyActivitySelection,
    textColor,
    mutedColor,
    accentColor,
    fontSize,
    maxApps,
    style: [{ height }, style],
  });
};

/** Height the extension's SocialCutView lays out in. */
export const SOCIAL_CUT_HEIGHT = 400;

/**
 * Last week's bars with the social media part of each day breaking off,
 * then "14h back." Plays once when it appears. All apps, every device.
 */
export const SocialCut: React.FC<Omit<CommonProps, "range" | "familyActivitySelection">> = ({
  textColor,
  mutedColor,
  accentColor,
  style,
}) => {
  const interval = useMemo(() => rangeToInterval("week"), []);
  const height = SOCIAL_CUT_HEIGHT;
  if (!NativeReport) return React.createElement(View, { style: [{ height }, style] });
  return React.createElement(NativeReport, {
    context: "socialCut",
    ...interval,
    textColor,
    mutedColor,
    accentColor,
    style: [{ height }, style],
  });
};

/** Height the extension's RecoveredView lays out in. */
export const RECOVERED_HEIGHT = 230;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Daily use of the pledged apps before Pledge vs since, and the hours that
 * came back, drawn by the system. The window runs from 7 days before the
 * start day of the first pledge to now; the extension does the comparing
 * (method in docs/product.md, "Time back").
 */
export const TimeRecovered: React.FC<{
  /** ISO start of every running pledge; the earliest anchors the comparison. */
  startedAt: string[];
  /** Base64 FamilyActivitySelection of every running pledge. */
  selections: string[];
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ startedAt, selections, textColor, mutedColor, accentColor, style }) => {
  const anchorMs = useMemo(() => Math.min(...startedAt.map((s) => new Date(s).getTime())), [startedAt]);
  const interval = useMemo(
    () => ({ startMs: startOfDay(anchorMs) - 7 * DAY_MS, endMs: Date.now(), segment: "daily" as const }),
    [anchorMs]
  );
  const height = RECOVERED_HEIGHT;
  if (!NativeReport) return React.createElement(View, { style: [{ height }, style] });
  return React.createElement(NativeReport, {
    context: "recovered",
    ...interval,
    anchorMs,
    familyActivitySelections: selections,
    textColor,
    mutedColor,
    accentColor,
    style: [{ height }, style],
  });
};
