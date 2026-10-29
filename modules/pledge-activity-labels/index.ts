import { requireNativeModule, requireNativeViewManager } from "expo-modules-core";
import React, { useMemo } from "react";
import { Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export interface ActivityLabelsProps {
  /** Base64 FamilyActivitySelection token from the picker. */
  familyActivitySelection?: string | null;
  style?: StyleProp<ViewStyle>;
  /** Width of each pill. The system label cannot report its own width. */
  pillWidth?: number;
  fontSize?: number;
}

type NativeLabelProps = {
  applicationToken?: string;
  categoryToken?: string;
  webDomainToken?: string;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
};

type TokenLists = { applications: string[]; categories: string[]; webDomains: string[] };

let NativeLabel: React.ComponentType<NativeLabelProps> | null = null;
let nativeModule: { listTokens: (selection: string) => TokenLists } | null = null;
if (Platform.OS === "ios") {
  try {
    NativeLabel = requireNativeViewManager("PledgeActivityLabels");
    nativeModule = requireNativeModule("PledgeActivityLabels");
  } catch {
    // Native module not in this binary (older dev build): render nothing.
    NativeLabel = null;
    nativeModule = null;
  }
}

export const isActivityLabelsAvailable = () => NativeLabel !== null;

/** Splits a selection into per-item opaque tokens. Empty lists when unavailable. */
export function listSelectionTokens(selection?: string | null): TokenLists {
  if (!nativeModule || !selection) return { applications: [], categories: [], webDomains: [] };
  try {
    return nativeModule.listTokens(selection);
  } catch {
    return { applications: [], categories: [], webDomains: [] };
  }
}

/**
 * Horizontal, scrollable row of pills, one per selected app / category /
 * site. Pills are laid out in React Native; only the icon+name inside each
 * is drawn natively by the system from the opaque token.
 */
export const ActivityLabels: React.FC<ActivityLabelsProps> = ({
  familyActivitySelection,
  style,
  pillWidth = 190,
  fontSize = 15,
}) => {
  const tokens = useMemo(() => listSelectionTokens(familyActivitySelection), [familyActivitySelection]);
  const items: { key: string; props: NativeLabelProps }[] = [
    ...tokens.applications.map((t, i) => ({ key: `a${i}`, props: { applicationToken: t } })),
    ...tokens.categories.map((t, i) => ({ key: `c${i}`, props: { categoryToken: t } })),
    ...tokens.webDomains.map((t, i) => ({ key: `w${i}`, props: { webDomainToken: t } })),
  ];

  if (!NativeLabel || items.length === 0) {
    return React.createElement(View, { style });
  }

  const Label = NativeLabel;
  return React.createElement(
    ScrollView,
    {
      horizontal: true,
      showsHorizontalScrollIndicator: false,
      style,
      contentContainerStyle: styles.row,
    },
    items.map((item) =>
      React.createElement(
        View,
        { key: item.key, style: [styles.pill, { width: pillWidth }] },
        React.createElement(Label, { ...item.props, fontSize, style: styles.label })
      )
    )
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: 8,
  },
  // The system draws the icon and name inside in the app's interface style
  // (white text, since the app is dark), so the pill is a dark surface.
  pill: {
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(248, 244, 236, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(248, 244, 236, 0.16)",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  label: {
    flex: 1,
  },
});
