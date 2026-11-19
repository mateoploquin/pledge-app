import React, { useEffect } from "react";
import { Image, ImageBackground, StyleSheet, View, StyleProp, ImageStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
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
const Backdrop: React.FC<{
  variant?: BackdropVariant;
  children?: React.ReactNode;
  /** An animated style on the light alone (Home's entrance after the seal):
   * the vignette and grain stay put, as on the seal's last frame. */
  lightStyle?: any;
}> = ({ variant = "quiet", children, lightStyle }) => {
  const brand = STRONG.includes(variant);
  const light = (
    <>
      <Image source={LIGHT[variant]} style={styles.fill} resizeMode="stretch" />
      {variant === "empty" && <DriftingSun />}
    </>
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lightStyle ? (
        <Animated.View style={[StyleSheet.absoluteFill, lightStyle]}>{light}</Animated.View>
      ) : (
        light
      )}
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
  // Paper C1: a 510 pt sun at left -60, top 640 on 844, blur 24 (the PNG
  // carries 72 pt of spread on each side), anchored to the screen's bottom.
  sun: { position: "absolute", left: -132, bottom: -378, width: 654, height: 654 },
  sunImage: { left: 0, top: 0 },
});

/**
 * The ground's low sun, drifting (owner, 18 Nov 2026: "make the sun behind
 * move around in the UI so the effect is seen/felt"): it starts where the
 * empty Home put it, low behind the main button, wanders up behind the
 * glass bubbles and settles back, once every 22 s. The glass catches it as
 * it passes. With Reduce Motion it stays put.
 */
const DRIFT_MS = 22000;
/** The path as offsets from the resting place (points), one loop. */
const PATH = [
  { x: 0, y: 0 },
  { x: -80, y: -150 },
  { x: 50, y: -240 },
  { x: 100, y: -90 },
  { x: 0, y: 0 },
];

const DriftingSun: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration: DRIFT_MS, easing: Easing.linear }), -1, false);
  }, [reduceMotion, t]);
  const style = useAnimatedStyle(() => {
    // Through the path's points, each leg eased in and out.
    const legs = PATH.length - 1;
    const p = t.value * legs;
    const i = Math.min(Math.floor(p), legs - 1);
    const f = p - i;
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    const a = PATH[i];
    const b = PATH[i + 1];
    return {
      transform: [{ translateX: a.x + (b.x - a.x) * e }, { translateY: a.y + (b.y - a.y) * e }] as any,
    };
  });
  return (
    <Animated.View style={[styles.sun, style]}>
      <Glow kind="lowSun" style={styles.sunImage} opacity={0.85} />
    </Animated.View>
  );
};

export const GROUND = color.bg;
export default Backdrop;
