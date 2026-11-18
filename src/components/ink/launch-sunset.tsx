import React, { useEffect, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { color } from "../../theme/tokens";

/**
 * The splash image (assets/splash.png, 1284 × 2778, "cover" on #140C0B):
 * the sun is a circle of radius 85 px centred on the image, resting on a
 * 342 × 6 px line whose middle is 83.5 px below the centre. Drawn here at the
 * same scale, so the hand-off from the static splash can't be seen.
 */
const IMAGE = { w: 1284, h: 2778 };
const SUN_R = 85;
const LINE_W = 342;
const LINE_H = 6;
const LINE_Y = 83.5;

/** How long the sun takes to go down. */
const SET_MS = 1500;
const FADE_MS = 450;

interface LaunchSunsetProps {
  /** The app underneath has loaded and drawn. */
  ready: boolean;
  /** The sunset has played and faded; unmount it. */
  onDone: () => void;
}

/**
 * The launch animation (owner, 17 Nov 2026): the static splash comes to life
 * as a sunset. The sun sinks behind the line, warming from ivory to the brand orange as
 * it goes, then the app fades in. Reduce Motion skips the sinking.
 */
const LaunchSunset: React.FC<LaunchSunsetProps> = ({ ready, onDone }) => {
  const { width, height } = useWindowDimensions();
  const s = Math.max(width / IMAGE.w, height / IMAGE.h);
  const r = SUN_R * s;
  const lineTop = height / 2 + (LINE_Y - LINE_H / 2) * s;

  const reduceMotion = useReducedMotion();
  const set = useSharedValue(0);
  const fade = useSharedValue(1);
  const [down, setDown] = useState(false);

  const start = () => {
    SplashScreen.hideAsync().catch(() => {});
    if (reduceMotion) {
      setDown(true);
      return;
    }
    set.value = withDelay(
      120,
      withTiming(1, { duration: SET_MS, easing: Easing.inOut(Easing.cubic) }, (done) => {
        if (done) runOnJS(setDown)(true);
      })
    );
  };

  useEffect(() => {
    if (!ready || !down) return;
    fade.value = withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.quad) }, (done) => {
      if (done) runOnJS(onDone)();
    });
  }, [ready, down, fade, onDone]);

  const sun = useAnimatedStyle(() => ({
    // From resting on the line to fully under it.
    transform: [{ translateY: set.value * (2 * r + LINE_H * s) }],
    backgroundColor: interpolateColor(set.value, [0, 0.35, 1], [color.text, color.solar, color.solar]),
    shadowOpacity: interpolate(set.value, [0, 0.4, 1], [0, 0.9, 0.4]),
  }));
  const veil = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.ground, veil]} onLayout={start} pointerEvents="none">
      {/* Everything below the line's top edge is cut off: the sun goes behind it. */}
      <View style={[styles.sky, { height: lineTop }]}>
        <Animated.View
          style={[
            styles.sun,
            { width: 2 * r, height: 2 * r, borderRadius: r, left: width / 2 - r, top: lineTop - 2 * r, shadowRadius: 18 * s * 3 },
            sun,
          ]}
        />
      </View>
      <View
        style={[styles.line, { width: LINE_W * s, height: LINE_H * s, left: width / 2 - (LINE_W * s) / 2, top: lineTop }]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ground: { backgroundColor: color.bg },
  sky: { position: "absolute", left: 0, right: 0, top: 0, overflow: "hidden" },
  sun: { position: "absolute", shadowColor: color.solar, shadowOffset: { width: 0, height: 0 } },
  line: { position: "absolute", backgroundColor: color.text },
});

export default LaunchSunset;
