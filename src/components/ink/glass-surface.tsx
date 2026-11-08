import React from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { glass, radius } from "../../theme/tokens";

/**
 * The one glass material (docs/design.md): cards and glass buttons share it
 * exactly. No shine line, no outer shadow, no brand tint; the colour comes
 * from the glow behind it.
 */
const GlassSurface: React.FC<{
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius; cards and buttons are both 24. */
  corner?: number;
}> = ({ children, style, corner = radius.glass }) => (
  <View style={[styles.shell, { borderRadius: corner }, style]}>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: corner, overflow: "hidden" }]}>
      <BlurView intensity={glass.blur} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={glass.fill}
        locations={glass.fillLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.rim, styles.rimTop]} />
      <View style={[styles.rim, styles.rimLeft]} />
      <View style={[styles.rim, styles.rimBottom]} />
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderColor: glass.border,
    overflow: "hidden",
  },
  rim: { position: "absolute" },
  rimTop: { top: 0, left: 0, right: 0, height: 1, backgroundColor: glass.rimTop },
  rimLeft: { top: 0, bottom: 0, left: 0, width: 1, backgroundColor: glass.rimLeft },
  rimBottom: { bottom: 0, left: 0, right: 0, height: 1, backgroundColor: glass.rimBottom },
});

export default GlassSurface;
