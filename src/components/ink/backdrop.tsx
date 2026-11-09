import React from "react";
import { Image, ImageBackground, StyleSheet, View, StyleProp, ImageStyle } from "react-native";
import { color, grain } from "../../theme/tokens";

/**
 * The ground of every "last light" screen (docs/design.md): espresso, a soft
 * light, film grain, and on brand moments a vignette.
 *
 * The lights are images exported from the Paper file ("App assets (export)"
 * board), because the owner picked blurred circles and React Native can't
 * blur a shape live.
 */
export type BackdropVariant = "brand" | "home" | "empty" | "quiet";

const LIGHT: Record<BackdropVariant, number> = {
  brand: require("../../../assets/glow/bg-brand.png"),
  home: require("../../../assets/glow/bg-home.png"),
  empty: require("../../../assets/glow/bg-empty.png"),
  quiet: require("../../../assets/glow/bg-quiet.png"),
};

const GRAIN = require("../../../assets/textures/grain.png");
const VIGNETTE = require("../../../assets/glow/vignette.png");

/** Variants that carry the vignette and the stronger grain, as in Paper. */
const STRONG: BackdropVariant[] = ["brand", "empty"];

/**
 * `children` are extra lights (a `Glow`), placed in screen coordinates and
 * drawn under the vignette and the grain, the same stacking as the Paper
 * artboards. A glow placed in the screen's content instead sits above the
 * grain, reads too bright, and moves with the content's padding.
 */
const Backdrop: React.FC<{ variant?: BackdropVariant; children?: React.ReactNode }> = ({
  variant = "quiet",
  children,
}) => {
  const brand = STRONG.includes(variant);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image source={LIGHT[variant]} style={styles.fill} resizeMode="stretch" />
      {children}
      {brand && <Image source={VIGNETTE} style={styles.fill} resizeMode="stretch" />}
      <ImageBackground
        source={GRAIN}
        resizeMode="repeat"
        style={[styles.fill, { opacity: brand ? grain.brand : grain.quiet }]}
      />
    </View>
  );
};

/**
 * One soft light, placed by the screen: the sun on a brand moment, the low
 * sun rising behind a button, or the glow behind a glass card so the glass
 * has something to show. Sizes include the blur's spread.
 */
const GLOW = {
  sun: { source: require("../../../assets/glow/glow-sun.png"), width: 448, height: 448 },
  lowSun: { source: require("../../../assets/glow/glow-low-sun.png"), width: 654, height: 654 },
  card: { source: require("../../../assets/glow/glow-card.png"), width: 546, height: 506 },
};

export const Glow: React.FC<{
  kind: keyof typeof GLOW;
  /** Position it absolutely; width and height default to the exported size. */
  style?: StyleProp<ImageStyle>;
  opacity?: number;
}> = ({ kind, style, opacity = 1 }) => {
  const g = GLOW[kind];
  return (
    <Image
      source={g.source}
      resizeMode="stretch"
      style={[{ position: "absolute", width: g.width, height: g.height, opacity }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
};

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined, backgroundColor: "transparent" },
});

export const GROUND = color.bg;
export default Backdrop;
