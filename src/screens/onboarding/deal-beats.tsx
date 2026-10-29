import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import AnimatedNumber from "../../components/text/animated-number";
import { cream, ember, fonts, ink, radius } from "../../theme/tokens";
import { CURRENCY_SYMBOL } from "../../config";

/**
 * The deal, told over the film after sign-in: six beats, each one line and
 * one small figure that moves on its own. Nothing to tap; a tap skips to
 * the next beat. Figures are drawn in the app's own ink and ember and only
 * ever fade, fill or count. Nothing slides.
 */

/** How long each beat holds before the next one. */
export const BEAT_MS = 3400;
/** The incoming beat fades in for this long before its figure starts. */
const SETTLE_MS = 550;
const ease = Easing.out(Easing.cubic);

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
  <View style={styles.row}>
    {["Instagram", "TikTok", "YouTube"].map((name, i) => (
      <Fade key={name} delay={SETTLE_MS + i * 240}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{name}</Text>
        </View>
      </Fade>
    ))}
  </View>
);

const RING = 128;
const STROKE = 7;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;

/** An ember ring that fills to `to` (0..1). */
const Ring: React.FC<{ from: number; to: number; duration: number; label: string; style?: any }> = ({
  from,
  to,
  duration,
  label,
  style,
}) => {
  const progress = useRun(from, to, duration, SETTLE_MS, false);
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [C, 0] });
  return (
    <Animated.View style={[styles.ring, style]}>
      <Svg width={RING} height={RING}>
        <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={ink.line} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={RING / 2}
          cy={RING / 2}
          r={R}
          stroke={ember}
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
        <Text style={styles.ringNumber}>{label}</Text>
        <Text style={styles.ringUnit}>min</Text>
      </View>
    </Animated.View>
  );
};

/** Beat 2: the limit. */
const Limit: React.FC = () => <Ring from={0} to={0.5} duration={1100} label="30" />;

/** A big serif amount, counting when `value` changes. */
const Money: React.FC<{ value: number; dim?: Animated.Value }> = ({ value, dim }) => (
  <Animated.Text style={[styles.money, dim ? { opacity: dim } : null]}>
    <Text style={styles.moneySign}>{CURRENCY_SYMBOL}</Text>
    <AnimatedNumber value={value} duration={900} />
  </Animated.Text>
);

/** Beat 3: the money, counting up from nothing. */
const Stake: React.FC = () => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setValue(10), SETTLE_MS);
    return () => clearTimeout(t);
  }, []);
  return <Money value={value} />;
};

/** Beat 4: the ring runs over, then the shield. */
const Lock: React.FC = () => {
  const ringOpacity = useRun(1, 0, 320, SETTLE_MS + 1000);
  const shieldOpacity = useRun(0, 1, 480, SETTLE_MS + 1150);
  return (
    <View style={styles.stack}>
      <Ring from={0.5} to={1} duration={900} label="60" style={{ opacity: ringOpacity }} />
      <Animated.View style={[styles.shield, { opacity: shieldOpacity }]}>
        <Text style={styles.shieldTitle}>That's enough for today.</Text>
        <View style={styles.shieldPill}>
          <Text style={styles.shieldPillText}>Keep my word</Text>
        </View>
        <Text style={styles.shieldQuiet}>Unlock for {CURRENCY_SYMBOL}10</Text>
      </Animated.View>
    </View>
  );
};

/** Beat 5: the money goes. */
const Pay: React.FC = () => {
  const dim = useRun(1, 0.4, 600, SETTLE_MS + 500);
  return (
    <View style={styles.column}>
      <Money value={10} dim={dim} />
      <Fade delay={SETTLE_MS + 700}>
        <Text style={styles.note}>charged</Text>
      </Fade>
    </View>
  );
};

/** Beat 6: the money stays, counting back to nothing. */
const Nothing: React.FC = () => {
  const [value, setValue] = useState(10);
  useEffect(() => {
    const t = setTimeout(() => setValue(0), SETTLE_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.column}>
      <Money value={value} />
      <Fade delay={SETTLE_MS + 1000}>
        <Text style={styles.note}>kept</Text>
      </Fade>
    </View>
  );
};

export interface DealBeat {
  /** `*word*` sets that word in italic. */
  line: string;
  Figure: React.FC;
}

export const DEAL_BEATS: DealBeat[] = [
  { line: "Pick the apps\nthat take your *time.*", Figure: Apps },
  { line: "Set how much\nis *enough* a day.", Figure: Limit },
  { line: "Put *money*\non it.", Figure: Stake },
  { line: "Go over, and they *lock*\nuntil midnight.", Figure: Lock },
  { line: "Unlock early,\nand you *pay.*", Figure: Pay },
  { line: "Keep your word,\nand it costs *nothing.*", Figure: Nothing },
];

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    backgroundColor: ink.raised,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillText: {
    color: cream.base,
    fontSize: 15,
    fontWeight: "500",
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringNumber: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
    color: cream.base,
  },
  ringUnit: {
    fontFamily: fonts.serifItalic,
    fontSize: 16,
    color: cream.muted,
  },
  stack: {
    width: 260,
    height: RING,
    alignItems: "center",
    justifyContent: "center",
  },
  shield: {
    position: "absolute",
    width: 236,
    backgroundColor: ink.raised,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 12,
  },
  shieldTitle: {
    color: cream.base,
    fontSize: 15,
    fontWeight: "600",
  },
  shieldPill: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: cream.base,
    borderRadius: radius.pill,
    paddingVertical: 9,
  },
  shieldPillText: {
    color: ink.base,
    fontSize: 13,
    fontWeight: "600",
  },
  shieldQuiet: {
    color: cream.muted,
    fontSize: 12,
  },
  column: {
    alignItems: "center",
    gap: 2,
  },
  money: {
    fontFamily: fonts.serif,
    fontSize: 76,
    lineHeight: 88,
    letterSpacing: -2,
    color: cream.base,
  },
  moneySign: {
    fontFamily: fonts.serifItalic,
    fontSize: 40,
    letterSpacing: 1,
    color: cream.muted,
  },
  note: {
    fontFamily: fonts.serifItalic,
    fontSize: 20,
    color: cream.muted,
  },
});
