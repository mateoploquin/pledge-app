import React, { useEffect, useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import InkScreen from "../../../components/ink/ink-screen";
import Caption from "../../../components/ink/caption";
import { openLegal } from "../../../services/legal";
import { haptics } from "../../../utils/haptics";
import { color, fonts } from "../../../theme/tokens";
import { CURRENCY_SYMBOL } from "../../../config";

/** One breath: how long the seal is held. */
const HOLD_MS = 4000;
/**
 * The sunset (owner, 18 Nov 2026: "have it sunset as you hold"), from the
 * owner's footage of the sun sinking into the sea (keep the maker's approval
 * in writing). Two cuts of it (made with an AVAssetWriter script, see
 * scripts/make-seal-clips.swift): at rest, its first 4 s at real speed played forward and
 * back, a seamless 8 s loop, so the sun shimmers and the screen is alive
 * before it's touched; held, the whole sunset (141 s) in one breath, 4 s at
 * 30 fps, every frame a keyframe so letting go can scrub it back.
 */
const IDLE = require("../../../../assets/video/seal-idle.mp4");
const SET = require("../../../../assets/video/seal-set.mp4");

/**
 * A poster (owner, 18 Nov 2026): the sunset fills the whole screen, the
 * words sit on the sea at the bottom. A touch of dark under the status bar
 * and back chevron, and more over the sea so the words read on any frame.
 */
const SHADE = {
  colors: [
    "rgba(20,12,11,0.45)",
    "rgba(20,12,11,0)",
    "rgba(20,12,11,0)",
    "rgba(20,12,11,0.55)",
  ] as const,
  locations: [0, 0.14, 0.6, 1] as const,
};

interface SealProps {
  counter: string;
  onBack?: () => void;
  name: string;
  setName: (n: string) => void;
  timeValue: number;
  durationDays: number;
  pledgeValue: number;
  starting: boolean;
  /** Records and starts the pledge; Home follows. */
  onSeal: () => Promise<void>;
}

/**
 * The seal (Paper v2.1 B9), always the last step. Replaces Review and the
 * terms checkbox (owner, 16 Nov 2026). Over the sunrise film, the oath told
 * like the mirror's story (owner, 18 Nov 2026: the serif caps and orange
 * name were off brand; the sun is the point of the screen): Inter only,
 * ivory, plain sentences with the terms in bold; tap the name to change it.
 * At rest the sun shimmers on the sea. Press and hold anywhere for one
 * breath (4 s): the sun sets in the film and haptics build; let go early and
 * it rises back. No ring or logo on the sunset (owner, 18 Nov 2026). Holding it through agrees to the terms
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
  starting,
  onSeal,
}) => {
  const progress = useSharedValue(0);
  // While held the film plays on its own; otherwise it follows `progress` (the sink).
  const holding = useSharedValue(0);
  // The held cut covers the resting loop as soon as the hold starts, and
  // hands back once it has run back to its first frame.
  const setStyle = useAnimatedStyle(() => ({
    opacity: progress.value > 0.001 ? 1 : 0,
  }));
  const film = useRef<Video>(null);
  const seeking = useRef(false);
  const nextSeek = useRef<number | null>(null);
  const sealing = useRef(false);
  const beats = useRef<ReturnType<typeof setTimeout> | null>(null);

  // One seek at a time; the latest wanted frame wins.
  const seekTo = (p: number) => {
    const ms = Math.round(p * HOLD_MS);
    if (seeking.current) {
      nextSeek.current = ms;
      return;
    }
    seeking.current = true;
    film.current
      ?.setPositionAsync(ms, {
        toleranceMillisBefore: 0,
        toleranceMillisAfter: 0,
      })
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
      progress.value = withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const onPressIn = () => {
    if (starting || sealing.current) return;
    beat(Date.now());
    holding.value = 1;
    film.current
      ?.playFromPositionAsync(Math.round(progress.value * HOLD_MS))
      .catch(() => {});
    progress.value = withTiming(
      1,
      { duration: HOLD_MS * (1 - progress.value), easing: Easing.linear },
      (done) => {
        if (done) runOnJS(sealed)();
      }
    );
  };

  const onPressOut = () => {
    if (sealing.current || progress.value >= 1) return;
    stopBeats();
    holding.value = 0;
    film.current?.pauseAsync().catch(() => {});
    cancelAnimation(progress);
    progress.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  };

  const editName = () =>
    Alert.prompt(
      "Your name",
      "As it goes on your pledge.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Done",
          onPress: (v?: string) => setName((v ?? "").trim().slice(0, 24)),
        },
      ],
      "plain-text",
      name
    );

  return (
    <InkScreen
      onBack={starting ? undefined : onBack}
      // Ivory: the tertiary grey disappears on the bright sky.
      topRight={<Caption tint={color.text}>{counter}</Caption>}
      footerBottom={36}
      backdrop={
        <>
          <View style={StyleSheet.absoluteFill}>
            <Video
              source={IDLE}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
            <Animated.View style={[StyleSheet.absoluteFill, setStyle]}>
              <Video
                ref={film}
                source={SET}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping={false}
                isMuted
              />
            </Animated.View>
          </View>
          <LinearGradient
            colors={SHADE.colors}
            locations={SHADE.locations}
            style={StyleSheet.absoluteFill}
          />
        </>
      }
      footer={
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={starting}
          accessibilityRole="button"
          accessibilityLabel="Hold to seal your pledge"
          accessibilityHint="Hold for four seconds. Sealing means you agree to the Terms and Privacy Policy."
          onAccessibilityAction={(e) =>
            e.nativeEvent.actionName === "activate" && sealed()
          }
          accessibilityActions={[{ name: "activate" }]}
          style={styles.footer}
        >
          <Text style={styles.hold}>
            {starting ? "Sealing" : "Press and hold to seal"}
          </Text>
          <Text style={styles.legal}>
            {"Nothing is charged now. Sealing means you agree to the "}
            <Text style={styles.link} onPress={() => openLegal("terms")}>
              Terms
            </Text>{" "}
            and{" "}
            <Text style={styles.link} onPress={() => openLegal("privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>
        </Pressable>
      }
    >
      {/* The whole screen is the control (owner, 18 Nov 2026: no logo or
          ring on the sunset): press and hold anywhere, the sun sets. The
          name and the links keep their own taps. */}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={starting}
        accessible={false}
        style={styles.content}
      >
        <Pressable
          onPress={editName}
          accessibilityRole="button"
          accessibilityLabel={`I, ${
            name || "your name"
          }, pledge. Change the name`}
        >
          <Text style={styles.oath}>
            {"I, "}
            {name ? (
              <Text style={styles.name}>{name}</Text>
            ) : (
              <Text style={styles.noName}>your name</Text>
            )}
            {", pledge"}
          </Text>
        </Pressable>
        {/* Only what's being promised (owner, 18 Nov 2026: "too much text"). */}
        <Text style={styles.line}>
          {timeValue === 0 ? "Apps blocked all day" : `${timeValue} min a day`}
          {` for ${durationDays} days,\nor I pay ${CURRENCY_SYMBOL}${pledgeValue}.`}
        </Text>
      </Pressable>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  // Two sizes of one face, ivory on the sunset: the oath, then the promise.
  content: { flex: 1, justifyContent: "flex-end", gap: 8, paddingBottom: 28 },
  oath: {
    fontFamily: fonts.uiSemibold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
    color: color.text,
  },
  name: {
    textDecorationLine: "underline",
    textDecorationColor: "rgba(248,240,230,0.45)",
  },
  // No name yet: a quiet prompt; tapping the oath sets it.
  noName: { color: color.textSecondary, textDecorationLine: "underline" },
  line: {
    fontFamily: fonts.ui,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.33,
    color: color.text,
  },
  footer: { alignItems: "center", gap: 6 },
  hold: {
    fontFamily: fonts.uiSemibold,
    fontSize: 16,
    lineHeight: 20,
    color: color.text,
  },
  legal: {
    fontFamily: fonts.ui,
    fontSize: 12,
    lineHeight: 16,
    color: color.textSecondary,
    textAlign: "center",
  },
  link: { color: color.text, textDecorationLine: "underline" },
});

export default Seal;
