import React, { createContext, useContext, useEffect } from "react";
import { StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  Extrapolation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Lockup from "../../components/ink/lockup";
import { spacing } from "../../theme/tokens";

/**
 * Home coming into being after the seal (owner, 19 Nov 2026: "the main menu
 * blur into existence ... the background slowly appears and then the
 * different elements"). The seal ends on the dark ground with the logo
 * already in Home's corner, so Home opens with no transition: the logo is
 * there, the ground's light fades up, and the rest comes into focus one
 * element at a time through a blur that clears.
 *
 * One clock, `t` in ms, runs once; every part reads its own window of it.
 */
export const ENTRANCE = {
  /** The ground's light fading up. */
  groundMs: 1300,
  /** The blur comes over the plain ground first (its tint would show as a
   * step from the seal's last frame), holds, then clears. */
  blurInMs: 500,
  blurFromMs: 900,
  blurToMs: 2400,
  blurIntensity: 45,
  /** The first element starts here, the next ones `staggerMs` apart. */
  firstAtMs: 700,
  staggerMs: 160,
  itemMs: 800,
  totalMs: 3000,
};

const EntranceClock = createContext<SharedValue<number> | null>(null);

/**
 * The entrance's clock: at its end from the start unless `on` (and Reduce
 * Motion is off), so Home is never left blank. A timer sets it to the end in
 * case the animation never runs (a view waiting on an animation to show
 * stayed blank once before: Dissolve in ink/line.tsx).
 */
export const useEntranceClock = (on: boolean, ready = true) => {
  const reduceMotion = useReducedMotion();
  const play = on && !reduceMotion;
  const t = useSharedValue(play ? 0 : ENTRANCE.totalMs);
  const started = React.useRef(false);
  useEffect(() => {
    if (!play || !ready || started.current) return;
    started.current = true;
    t.value = withTiming(ENTRANCE.totalMs, { duration: ENTRANCE.totalMs, easing: Easing.linear });
    const safety = setTimeout(() => {
      t.value = ENTRANCE.totalMs;
    }, ENTRANCE.totalMs + 1500);
    return () => clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return t;
};

export const EntranceProvider = EntranceClock.Provider;

const ease = (x: number) => {
  "worklet";
  const p = Math.min(1, Math.max(0, x));
  return 1 - Math.pow(1 - p, 3);
};

/** The ground's light (Backdrop), fading up first. */
export const useGroundStyle = (t: SharedValue<number>) =>
  useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, ENTRANCE.groundMs], [0, 1], Extrapolation.CLAMP),
  }));

/**
 * One element of Home, in its turn (`order` 0, 1, 2, …): it fades in and
 * settles a few points up while the blur over the screen clears.
 */
export const Enter: React.FC<{ order: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }> = ({
  order,
  style,
  children,
}) => {
  const clock = useContext(EntranceClock);
  const fallback = useSharedValue(ENTRANCE.totalMs);
  const t = clock ?? fallback;
  const start = ENTRANCE.firstAtMs + order * ENTRANCE.staggerMs;
  const animated = useAnimatedStyle(() => {
    const p = ease((t.value - start) / ENTRANCE.itemMs);
    return { opacity: p, transform: [{ translateY: 6 * (1 - p) }] };
  });
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
};

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

/** The blur over Home's content, clearing; gone once clear so it costs nothing after. */
export const EntranceBlur: React.FC<{ t: SharedValue<number> }> = ({ t }) => {
  const props = useAnimatedProps(() => ({
    intensity:
      ENTRANCE.blurIntensity *
      (1 - ease((t.value - ENTRANCE.blurFromMs) / (ENTRANCE.blurToMs - ENTRANCE.blurFromMs))),
  }));
  const style = useAnimatedStyle(() => ({
    opacity: t.value >= ENTRANCE.blurToMs ? 0 : ease(t.value / ENTRANCE.blurInMs),
  }));
  return (
    <AnimatedBlur
      pointerEvents="none"
      tint="dark"
      animatedProps={props}
      style={[StyleSheet.absoluteFill, style]}
    />
  );
};

/**
 * Where Home's logo sits, below the safe area: InkScreen pads the top by 8,
 * the header by 4, and the 130 pt lockup is centred in the 44 pt row of the
 * account button. The seal sets its logo down exactly here.
 */
export const HOME_LOGO_TOP = 8 + 4 + (44 - (130 * 420) / 1600) / 2;

/**
 * The logo stays sharp over the blur: a copy where the seal left it (its
 * end point in seal.tsx: spacing.lg in, HOME_LOGO_TOP down, 130 wide),
 * above the blur, until the blur has cleared; Home's own logo shows then.
 */
export const EntranceLogo: React.FC<{ t: SharedValue<number> }> = ({ t }) => {
  const insets = useSafeAreaInsets();
  const style = useAnimatedStyle(() => ({ opacity: t.value >= ENTRANCE.blurToMs ? 0 : 1 }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: spacing.lg, top: insets.top + HOME_LOGO_TOP }, style]}
    >
      <Lockup />
    </Animated.View>
  );
};

/** Home's own logo: hidden under the copy while the blur clears. */
export const useHomeLogoStyle = (t: SharedValue<number>) =>
  useAnimatedStyle(() => ({ opacity: t.value >= ENTRANCE.blurToMs ? 1 : 0 }));
