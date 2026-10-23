import { requireNativeViewManager } from "expo-modules-core";
import React from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";

export interface ActivityLabelsProps {
  /** Base64 FamilyActivitySelection token from the picker. */
  familyActivitySelection?: string | null;
  iconSize?: number;
  showNames?: boolean;
  style?: StyleProp<ViewStyle>;
}

let NativeView: React.ComponentType<ActivityLabelsProps> | null = null;
if (Platform.OS === "ios") {
  try {
    NativeView = requireNativeViewManager("PledgeActivityLabels");
  } catch {
    // Native module not in this binary (older dev build): render nothing.
    NativeView = null;
  }
}

/** Icons and names of the selected apps, drawn by the system from opaque tokens. */
export const ActivityLabels: React.FC<ActivityLabelsProps> = (props) => {
  if (!NativeView || !props.familyActivitySelection) {
    return React.createElement(View, { style: props.style });
  }
  return React.createElement(NativeView, props);
};

export const isActivityLabelsAvailable = () => NativeView !== null;
