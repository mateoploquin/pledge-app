import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet, View, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { glass, radius } from "../../theme/tokens";

/**
 * The one glass material (docs/design.md): cards and glass buttons share it
 * exactly, drawn the way the v2 Paper file draws it:
 *
 *   linear-gradient(135deg, #FFECD629 0%, #F8F0E60F 45%, #24131059 100%)
 *   border 1px #FFDEC438, radius 24
 *   inset rims: #FFF0E073 0 1px (top), #FFD6AA2E 1px 0 (left), #ED602A59 0 -1px (bottom)
 *
 * No system blur: every iOS blur style lays a grey tint over what's behind
 * (the "dark" one made the cards muddy), while Paper's blur is clear. What
 * sits behind glass in Pledge is already a soft glow, so the clear gradient
 * alone reads as the thin glass of the design and lets the glow through.
 */
const GlassSurface: React.FC<{
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius; cards and buttons are both 24. */
  corner?: number;
}> = ({ children, style, corner = radius.glass }) => {
  const [size, setSize] = useState({ w: 342, h: 160 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0 && (width !== size.w || height !== size.h)) setSize({ w: width, h: height });
  };

  // CSS 135deg on a w×h box: the gradient line runs through the centre at 45°
  // and is (w + h)·cos45 long, so its ends sit outside the box on wide cards.
  const dx = (size.w + size.h) / (4 * size.w);
  const dy = (size.w + size.h) / (4 * size.h);
  const inner = Math.max(corner - 1, 0);

  return (
    <View style={[styles.shell, { borderRadius: corner }, style]} onLayout={onLayout}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: inner, overflow: "hidden" }]}>
        <LinearGradient
          colors={glass.fill}
          locations={glass.fillLocations}
          start={{ x: 0.5 - dx, y: 0.5 - dy }}
          end={{ x: 0.5 + dx, y: 0.5 + dy }}
          style={StyleSheet.absoluteFill}
        />
        {/* The three inset rims as one inner border, so they follow the corners. */}
        <View style={[StyleSheet.absoluteFill, styles.rims, { borderRadius: inner }]} />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderColor: glass.border,
  },
  rims: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: glass.rimTop,
    borderLeftColor: glass.rimLeft,
    borderBottomColor: glass.rimBottom,
    borderRightWidth: 0,
  },
});

export default GlassSurface;
