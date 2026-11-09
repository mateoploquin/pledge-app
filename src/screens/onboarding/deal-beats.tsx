import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import AnimatedNumber from "../../components/text/animated-number";
import { color, fonts, glass, radius, type } from "../../theme/tokens";
import { CURRENCY_SYMBOL } from "../../config";

/**
 * The deal, told after sign-in and the welcome (see onboarding.tsx): four
 * beats of how, each one line and one small figure that moves on its own,
 * inside the beat's glass card. Nothing to tap; a tap skips to the next beat.
 *
 * The figures are the v1 ones (apps appear, a ring fills while the money
 * counts, the limit runs out into the shield, the money goes), redrawn in the
 * last-light brand: Inter for every number and label, ivory on glass, the
 * solar accent for the ring. They only fade, fill or count. Nothing slides.
 */

/** How long each beat holds before the next one. */
export const BEAT_MS = 3400;
/** The incoming beat dissolves in for this long before its figure starts. */
const SETTLE_MS = 550;
const ease = Easing.out(Easing.cubic);

/** Every figure sits in the same height so the card never changes size. */
export const FIGURE_HEIGHT = 128;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Runs a value from `from` to `to` once, after `delay`, when mounted. */
function useRun(from: number, to: number, duration: number, delay = SETTLE_MS, native = true) {
  const value = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const run = Animated.timing(value, { toValue: to, duration, delay, easing: ease, useNativeDriver: native });
    run.start();
    return () => run.stop();
  }, [value, to, duration, delay, native]);
  return value;
}

const Fade: React.FC<{ delay: number; children: React.ReactNode; style?: any }> = ({ delay, children, style }) => {
  const opacity = useRun(0, 1, 480, delay);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
};

/** Beat 1: the chosen apps appear one by one. */
const Apps: React.FC = () => (
  <View style={styles.figure}>
    <Text style={styles.label}>Your apps</Text>
    <View style={styles.chips}>
      {["Instagram", "TikTok", "YouTube"].map((name, i) => (
        <Fade key={name} delay={SETTLE_MS + i * 240}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{name}</Text>
          </View>
        </Fade>
      ))}
    </View>
  </View>
);

const RING = 112;
const STROKE = 6;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;

/** A solar ring that fills to `to` (0..1), the minutes in its middle. */
const Ring: React.FC<{ from: number; to: number; duration: number; style?: any }> = ({ from, to, duration, style }) => {
  const progress = useRun(from, to, duration, SETTLE_MS, false);
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });
  return (
    <Animated.View style={[styles.ring, style]}>
      <Svg width={RING} height={RING}>
        <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={color.surfacePressed} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={RING / 2}
          cy={RING / 2}
          r={R}
          stroke={color.solar}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={offset}
          rotation={-90}
          origin={`${RING / 2}, ${RING / 2}`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text style={styles.ringNumber}>30</Text>
        <Text style={styles.ringUnit}>min</Text>
      </View>
    </Animated.View>
  );
};

/** The amount, counting when `value` changes. */
const Money: React.FC<{ value: number; dim?: Animated.Value }> = ({ value, dim }) => (
  <Animated.Text style={[styles.money, dim ? { opacity: dim } : null]}>
    <Text style={styles.moneySign}>{CURRENCY_SYMBOL}</Text>
    <AnimatedNumber value={value} duration={900} />
  </Animated.Text>
);

/** Beat 2: the ring fills to the limit, then the money counts up beside it. */
const LimitAndStake: React.FC = () => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setValue(10), SETTLE_MS + 1000);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={[styles.figure, styles.pair]}>
      <Ring from={0} to={1} duration={1100} />
      <Fade delay={SETTLE_MS + 900} style={styles.stake}>
        <Text style={styles.label}>Your pledge</Text>
        <Money value={value} />
      </Fade>
    </View>
  );
};

/** Beat 3: the same limit runs out, then the shield the user will see. */
const Lock: React.FC = () => {
  const ringOpacity = useRun(1, 0, 320, SETTLE_MS + 1000);
  const shieldOpacity = useRun(0, 1, 480, SETTLE_MS + 1150);
  return (
    <View style={[styles.figure, styles.center]}>
      <Ring from={0.5} to={1} duration={900} style={{ opacity: ringOpacity }} />
      <Animated.View style={[styles.shield, { opacity: shieldOpacity }]}>
        <Text style={styles.shieldTitle}>That's enough for today.</Text>
        <View style={styles.shieldButton}>
          <Text style={styles.shieldButtonText}>Keep my word</Text>
        </View>
        <Text style={styles.shieldQuiet}>Unlock for {CURRENCY_SYMBOL}10</Text>
      </Animated.View>
    </View>
  );
};

/** Beat 4: the money goes. */
const Pay: React.FC = () => {
  const dim = useRun(1, 0.35, 600, SETTLE_MS + 500);
  return (
    <View style={[styles.figure, styles.center]}>
      <Money value={10} dim={dim} />
      <Fade delay={SETTLE_MS + 700}>
        <Text style={styles.charged}>charged</Text>
      </Fade>
    </View>
  );
};

export interface DealBeat {
  line: string;
  Figure: React.FC;
}

export const DEAL_BEATS: DealBeat[] = [
  { line: "Pick your\napps.", Figure: Apps },
  { line: "Set a limit.\nPut money\non it.", Figure: LimitAndStake },
  { line: "Hit it, and\nthey lock.", Figure: Lock },
  { line: "Unlock early?\nYou lose it.", Figure: Pay },
];

const styles = StyleSheet.create({
  figure: { height: FIGURE_HEIGHT, justifyContent: "center" },
  center: { alignItems: "center" },
  label: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 18, color: glass.textSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: {
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: "rgba(248,240,230,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: { fontFamily: fonts.uiMedium, fontSize: 15, lineHeight: 18, color: color.text },
  ring: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  ringLabel: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  ringNumber: { fontFamily: fonts.uiSemibold, fontSize: 32, lineHeight: 36, letterSpacing: -0.64, color: color.text },
  ringUnit: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 18, color: glass.textSecondary },
  pair: { flexDirection: "row", alignItems: "center", gap: 28 },
  stake: { gap: 2 },
  money: { ...type.value },
  moneySign: { fontFamily: fonts.uiSemibold, fontSize: 28, color: glass.textSecondary },
  shield: {
    position: "absolute",
    alignSelf: "center",
    width: 236,
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.card,
    backgroundColor: color.raised,
    borderWidth: 1,
    borderColor: glass.border,
  },
  shieldTitle: { fontFamily: fonts.uiSemibold, fontSize: 15, lineHeight: 18, color: color.text },
  shieldButton: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: color.action,
    borderRadius: radius.control,
    paddingVertical: 9,
  },
  shieldButtonText: { fontFamily: fonts.uiSemibold, fontSize: 13, lineHeight: 16, color: color.onAction },
  shieldQuiet: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 16, color: glass.textSecondary },
  charged: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 20, color: glass.textSecondary },
});
