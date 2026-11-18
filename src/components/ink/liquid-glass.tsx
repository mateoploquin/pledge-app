import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { liquidGlass } from "../../theme/tokens";

/**
 * The liquid glass of the seal's hold ring (owner, 14 Nov 2026): smoked, blurred
 * glass that darkens what's behind it, a fine light hairline all round, a
 * brighter rim along the top and a soft sheen falling from it. Unlike the
 * clear card glass it blurs, so the words on it read over any film.
 */
const LiquidGlass: React.FC<{ style?: StyleProp<ViewStyle>; corner?: number }> = ({ style, corner = liquidGlass.radius }) => (
  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: corner, overflow: "hidden" }, style]}>
    <BlurView intensity={liquidGlass.blur} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: liquidGlass.smoke }]} />
    <LinearGradient
      colors={liquidGlass.sheen}
      locations={[0, 0.5, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: corner,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: liquidGlass.edge,
          borderTopColor: liquidGlass.rimTop,
        },
      ]}
    />
  </View>
);

export default LiquidGlass;
