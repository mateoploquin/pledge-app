import { requireNativeModule, requireNativeViewManager } from "expo-modules-core";
import React from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";

type NativeProps = { cornerRadius?: number; tint?: string; style?: StyleProp<ViewStyle> };

let NativeGlass: React.ComponentType<NativeProps> | null = null;
let supported = false;
if (Platform.OS === "ios") {
  try {
    supported = requireNativeModule("PledgeGlass").isSupported();
    if (supported) NativeGlass = requireNativeViewManager("PledgeGlass");
  } catch {
    NativeGlass = null;
    supported = false;
  }
}

/** True on iOS 26+ builds that carry the module: Apple's Liquid Glass is there. */
export const isLiquidGlassAvailable = () => supported && NativeGlass !== null;

/** The system's Liquid Glass, filling its parent; draws nothing elsewhere. */
export const LiquidGlass: React.FC<NativeProps> = (props) =>
  NativeGlass ? React.createElement(NativeGlass, props) : null;
