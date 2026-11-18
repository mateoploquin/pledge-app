import React, { useEffect, useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import InkScreen from "../../../components/ink/ink-screen";
import Caption from "../../../components/ink/caption";
import LiquidGlass from "../../../components/ink/liquid-glass";
import { openLegal } from "../../../services/legal";
import { haptics } from "../../../utils/haptics";
import { color, fonts, type } from "../../../theme/tokens";
import { CURRENCY_SYMBOL } from "../../../config";
import { Reason } from "../use-pledge-wizard";

/** One breath: how long the seal is held. */
const HOLD_MS = 4000;
const RING = 84;
const R = 40;
const CIRC = 2 * Math.PI * R;
/**
 * The sun rising out of the trees (owner, 13 Nov 2026): a Pinterest sunset
 * the owner has the maker's approval for (keep it in writing), played
 * backwards and cut to one breath. 4 s, 30 fps, every frame a keyframe so
 * letting go can scrub it back. Frame 0 is the sun on the ridge, the last
 * frame is the sun just clear of it.
 */
const RISE = require("../../../../assets/video/seal-rise.mp4");

/** Dark at the top for the oath, clear over the sun, dark again for the ring (Paper v2.1 B9). */
const SEAL_SHADE = {
  colors: ["rgba(20,12,11,0.78)", "rgba(20,12,11,0.45)", "rgba(20,12,11,0)", "rgba(20,12,11,0)", "rgba(20,12,11,0.70)"] as const,
  locations: [0, 0.34, 0.52, 0.7, 1] as const,
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface SealProps {
  counter: string;
  onBack?: () => void;
  name: string;
  setName: (n: string) => void;
  timeValue: number;
  durationDays: number;
  pledgeValue: number;
  reason: Reason | null;
  starting: boolean;
  /** Records and starts the pledge; Home follows. */
  onSeal: () => Promise<void>;
}

/**
 * The seal (Paper v2.1 B9), always the last step. Replaces Review and the
 * terms checkbox (owner, 16 Nov 2026). "I, NAME, PLEDGE." in Noto Serif
 * Display caps; tap the name to change it. Hold the liquid glass ring for one
 * breath (4 s): it fills, the sunrise film plays with it and haptics build;
 * let go early and the film runs back. Holding it through agrees to the terms
 * and starts the pledge.
 */
const Seal: React.FC<SealProps> = ({
  counter,
  onBack,
  name,
  setName,
  timeValue,
  durationDays,
  pledgeValue,
  reason,
  starting,
  onSeal,
}) => {
  const progress = useSharedValue(0);
  // While held the film plays on its own; otherwise it follows `progress` (the sink).
  const holding = useSharedValue(0);
  const film = useRef<Video>(null);
  const seeking = useRef(false);
  const nextSeek = useRef<number | null>(null);
  const sealing = useRef(false);
  const beats = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ends = new Date(Date.now() + durationDays * 86_400_000);
  const terms = [
    timeValue === 0 ? "Blocked all day" : `${timeValue} min a day`,
    `${durationDays} days`,
    `${CURRENCY_SYMBOL}${pledgeValue}`,
    `ends ${ends.getDate()} ${MONTHS[ends.getMonth()]}`,
  ].join(" · ");
  const forLine = reason ? `For ${reason.toLowerCase()}.` : null;

  // One seek at a time; the latest wanted frame wins.
  const seekTo = (p: number) => {
    const ms = Math.round(p * HOLD_MS);
    if (seeking.current) {
      nextSeek.current = ms;
      return;
    }
    seeking.current = true;
    film.current
      ?.setPositionAsync(ms, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 })
      .catch(() => {})
      .finally(() => {
        seeking.current = false;
        const next = nextSeek.current;
        nextSeek.current = null;
        if (next !== null && next !== ms) seekTo(next / HOLD_MS);
      });
  };

  useAnimatedReaction(
    () => progress.value,
    (p, prev) => {
      if (!holding.value && p !== prev) runOnJS(seekTo)(p);
    }
  );

  const stopBeats = () => {
    if (beats.current) clearTimeout(beats.current);
    beats.current = null;
  };

  // Haptics build through the breath: slower and light at first, then quicker and firmer.
  const beat = (startedAt: number) => {
    const k = (Date.now() - startedAt) / HOLD_MS;
    if (k >= 1) return;
    k < 0.6 ? haptics.tap() : haptics.press();
    beats.current = setTimeout(() => beat(startedAt), 520 - 360 * k);
  };

  useEffect(() => stopBeats, []);

  const sealed = async () => {
    stopBeats();
    if (sealing.current) return;
    sealing.current = true;
    try {
      await onSeal();
    } finally {
      sealing.current = false;
      // Still here means it didn't start (an alert said why): the sun sinks back.
      holding.value = 0;
      progress.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
    }
  };

  const onPressIn = () => {
    if (starting || sealing.current) return;
    beat(Date.now());
    holding.value = 1;
    film.current?.playFromPositionAsync(Math.round(progress.value * HOLD_MS)).catch(() => {});
    progress.value = withTiming(1, { duration: HOLD_MS * (1 - progress.value), easing: Easing.linear }, (done) => {
      if (done) runOnJS(sealed)();
    });
  };

  const onPressOut = () => {
    if (sealing.current || progress.value >= 1) return;
    stopBeats();
    holding.value = 0;
    film.current?.pauseAsync().catch(() => {});
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  };

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - progress.value) }));

  const editName = () =>
    Alert.prompt(
      "Your name",
      "As it goes on your pledge.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Done", onPress: (v?: string) => setName((v ?? "").trim().slice(0, 24)) },
      ],
      "plain-text",
      name
    );

  return (
    <InkScreen
      onBack={starting ? undefined : onBack}
      topRight={<Caption>{counter}</Caption>}
      footerBottom={36}
      backdrop={
        <>
          <Video
            ref={film}
            source={RISE}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
            isMuted
          />
          <LinearGradient colors={SEAL_SHADE.colors} locations={SEAL_SHADE.locations} style={StyleSheet.absoluteFill} />
        </>
      }
      footer={
        <View style={styles.footer}>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={starting}
            accessibilityRole="button"
            accessibilityLabel="Hold to seal your pledge"
            accessibilityHint="Hold for four seconds. Sealing means you agree to the Terms and Privacy Policy."
            onAccessibilityAction={(e) => e.nativeEvent.actionName === "activate" && sealed()}
            accessibilityActions={[{ name: "activate" }]}
            style={styles.ring}
          >
            <LiquidGlass corner={RING / 2} />
            <View style={styles.sun} />
            <Svg width={RING} height={RING} style={styles.ringSvg}>
              <AnimatedCircle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                fill="none"
                stroke={color.solar}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={`${CIRC}`}
                animatedProps={ringProps}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
            </Svg>
          </Pressable>
          <Text style={styles.hold}>{starting ? "Sealing" : "Hold to seal · one breath"}</Text>
          <Text style={styles.legal}>
            {`Nothing is charged now. You pay ${CURRENCY_SYMBOL}${pledgeValue} only if you unlock early, delete Pledge or turn off Screen Time. Sealing means you agree to the `}
            <Text style={styles.link} onPress={() => openLegal("terms")}>Terms</Text> and{" "}
            <Text style={styles.link} onPress={() => openLegal("privacy")}>Privacy Policy</Text>.
          </Text>
        </View>
      }
    >
      <View style={styles.content}>
        <Pressable onPress={editName} accessibilityRole="button" accessibilityLabel={`I, ${name || "your name"}, pledge. Change the name`}>
          <Text style={styles.oath}>
            {"I, "}
            {name ? <Text style={styles.name}>{name}</Text> : <Text style={[styles.name, styles.noName]}>Your name</Text>}
            {",\npledge."}
          </Text>
        </Pressable>
        <View style={styles.rule} />
        <Text style={styles.terms}>{terms}</Text>
        {forLine ? <Text style={styles.for}>{forLine}</Text> : null}
      </View>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  content: { paddingTop: 24, gap: 18 },
  oath: {
    fontFamily: fonts.display,
    fontSize: 64,
    lineHeight: 66,
    letterSpacing: -0.64,
    textTransform: "uppercase",
    color: color.text,
  },
  name: { color: color.solar },
  // No name yet: a quiet orange prompt; tapping the oath sets it.
  noName: { opacity: 0.55 },
  rule: { height: 1, backgroundColor: "rgba(248,240,230,0.35)" },
  terms: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 1.54,
    textTransform: "uppercase",
    color: color.text,
  },
  for: type.body,
  footer: { alignItems: "center", gap: 14 },
  ring: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  sun: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: color.solar,
    shadowColor: color.solar,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  ringSvg: { position: "absolute", left: 0, top: 0 },
  hold: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.54,
    textTransform: "uppercase",
    color: color.text,
  },
  legal: { ...type.small, textAlign: "center" },
  link: { color: color.text, textDecorationLine: "underline" },
});

export default Seal;
