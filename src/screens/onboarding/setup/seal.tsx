import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import InkScreen from "../../../components/ink/ink-screen";
import Caption from "../../../components/ink/caption";
import Lockup from "../../../components/ink/lockup";
import { HOME_LOGO_TOP } from "../../home/sealed-entrance";
import SignatureInk from "../../../components/ink/signature-ink";
import { openLegal } from "../../../services/legal";
import { haptics } from "../../../utils/haptics";
import { color, fonts, spacing } from "../../../theme/tokens";
import { CURRENCY_SYMBOL } from "../../../config";

/** One breath: how long the seal is held. */
const HOLD_MS = 4000;
/**
 * The sunset (owner, 19 Nov 2026), from the owner's footage of the sun
 * setting behind a hill (keep the maker's approval in writing). One cut
 * (scripts/make-seal-clips.swift): the sun from the upper sky until it is
 * gone and the sky dark, in one breath, 4 s at 30 fps, every frame a
 * keyframe so letting go can scrub it back.
 *
 * At rest (owner, 19 Nov 2026: the light alive, the sun not travelling): 2 s
 * of the same footage just before the cut starts, the sun held in place in
 * every frame and only the sun and its glow taken from the moving film, over
 * the cut's first frame, looped with a crossfade and played fast like the
 * held cut. Made by scripts/make-seal-rest.py.
 */
const SET = require("../../../../assets/video/seal-set.mp4");
const REST = require("../../../../assets/video/seal-rest.mp4");
/** The rest loop's speed (owner, 19 Nov 2026: "much faster, just like in the video"). */
const REST_RATE = 2.6;
const GRAIN = require("../../../../assets/textures/grain.png");

/**
 * The screen goes dark with the sun (owner, 19 Nov 2026: "the darkening to
 * happen at the same time as the sun sets"): the last of it slips behind the
 * hill at 92% of the hold, and so does the light, slowly and then quickly.
 */
const DUSK = { from: 0.35, to: 0.92, curve: 2.4 };
/** The name is written over most of the breath, done just before the sun is gone. */
const WRITE = { from: 0.05, to: 0.85 };

/**
 * The close (owner, 19 Nov 2026: "when the sun sets, the screen darkens, and
 * the logo appears ... seal the moment in time"; then, the same day: "a
 * dramatic pause when the screen goes dark"). The screen is dark and only
 * the signed pledge stays, the name on it (the hold prompt goes); a pause;
 * the logo comes up in the middle; a pause; the signed pledge goes; then the
 * logo moves to where it sits on Home, and Home follows.
 */
const CLOSE = {
  footerMs: 300,
  darkPauseMs: 2000,
  logoMs: 1000,
  logoPauseMs: 1900,
  wordsMs: 600,
  moveMs: 900,
  endMs: 100,
};
const CLOSE_LOGO_AT = CLOSE.darkPauseMs;
const CLOSE_WORDS_AT = CLOSE_LOGO_AT + CLOSE.logoMs + CLOSE.logoPauseMs;
const CLOSE_MOVE_AT = CLOSE_WORDS_AT + CLOSE.wordsMs;
const CLOSE_TOTAL = CLOSE_MOVE_AT + CLOSE.moveMs + CLOSE.endMs;
/** The logo in the middle, and on Home (components/ink/lockup, 1600 × 420). */
const LOGO_MID = 200;
const LOGO_HOME = 130;
const LOCKUP_RATIO = 420 / 1600;

/** A touch of dark under the status bar and over the words. */
const SHADE = {
  colors: ["rgba(20,12,11,0.45)", "rgba(20,12,11,0)", "rgba(20,12,11,0)", "rgba(20,12,11,0.55)"] as const,
  locations: [0, 0.14, 0.6, 1] as const,
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const signedOn = (d: Date) => `SIGNED ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

const ramp = (x: number, a: number, b: number) => {
  "worklet";
  return Math.max(0, Math.min(1, (x - a) / (b - a)));
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
  /** Records and starts the pledge, then waits for `ready` before Home. */
  onSeal: (ready: Promise<unknown>) => Promise<boolean>;
}

/**
 * The seal (Paper v2.1 B9), always the last step: a poster. The sunset fills
 * the screen, its light flickering; on it, the promise in plain words
 * ("30 min a day. 30 days. or I pay $10.") and a signature line. Tap the line
 * to change the name. Press and hold anywhere for one breath (4 s): the sun
 * sets behind the hill and the screen darkens with it, haptics building,
 * while the user's name writes itself on the line in one hand; let go early
 * and it all goes back. Once the sun is gone, in the dark, the signed pledge
 * stays alone; a pause; the Pledge logo comes up; a pause; the pledge fades
 * and the logo moves to its place on Home, and Home follows (see CLOSE).
 * Holding it through agrees to the terms and starts the pledge.
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
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  // While held the film plays on its own; otherwise it follows `progress`.
  const holding = useSharedValue(0);
  // The close: the hold prompt leaves, the logo comes up, the signed
  // pledge leaves, then the logo moves.
  const footerOut = useSharedValue(0);
  const wordsOut = useSharedValue(0);
  const logoIn = useSharedValue(0);
  const move = useSharedValue(0);
  const [closing, setClosing] = useState(false);
  // Where the signed pledge starts on screen, so the logo never lands on it.
  const wordsRef = useRef<View>(null);
  const [wordsTop, setWordsTop] = useState<number | null>(null);
  const film = useRef<Video>(null);
  const seeking = useRef(false);
  const nextSeek = useRef<number | null>(null);
  const sealing = useRef(false);
  const beats = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Making the hold obvious (owner, 19 Nov 2026: "some users might not
  // understand it"): the hold button breathes while it waits, fills as it
  // is held, and a tap that lets go too soon says to keep holding.
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const [tooShort, setTooShort] = useState(false);
  // Coming in (owner, 19 Nov 2026: "appears gradually, not just switching"):
  // the screen opens on the same ground the step before had (this screen's
  // backdrop is the same "empty" light), the sunset film fades up over it,
  // then the promise, then the hold button. It starts when the film can
  // show its first frame, or after 0.7 s at most.
  const enter = useSharedValue(reduceMotion ? 1 : 0);
  const entered = useRef(false);
  const startEnter = () => {
    if (entered.current) return;
    entered.current = true;
    enter.value = withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) });
  };
  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(startEnter, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tooShortTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      )
    );
    return () => {
      cancelAnimation(pulse);
      if (tooShortTimer.current) clearTimeout(tooShortTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

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

  /**
   * In the dark, the signed pledge alone; a pause; the logo; a pause; the
   * pledge goes and the logo moves to Home's corner. Resolves when it is there.
   */
  const playClose = () => {
    setClosing(true);
    footerOut.value = withTiming(1, { duration: CLOSE.footerMs, easing: Easing.inOut(Easing.cubic) });
    logoIn.value = withDelay(
      CLOSE_LOGO_AT,
      withTiming(1, { duration: CLOSE.logoMs, easing: Easing.inOut(Easing.sin) })
    );
    wordsOut.value = withDelay(
      CLOSE_WORDS_AT,
      withTiming(1, { duration: CLOSE.wordsMs, easing: Easing.inOut(Easing.cubic) })
    );
    move.value = withDelay(
      CLOSE_MOVE_AT,
      withTiming(1, { duration: CLOSE.moveMs, easing: Easing.inOut(Easing.cubic) })
    );
    return new Promise<void>((resolve) => setTimeout(resolve, CLOSE_TOTAL));
  };

  const sealed = async () => {
    stopBeats();
    if (sealing.current) return;
    sealing.current = true;
    let started = false;
    try {
      started = await onSeal(playClose());
    } finally {
      sealing.current = false;
      if (!started) {
        // It didn't start (an alert said why): the sunset comes back.
        setClosing(false);
        move.value = 0;
        logoIn.value = withTiming(0, { duration: 300 });
        wordsOut.value = withTiming(0, { duration: 500 });
        footerOut.value = withTiming(0, { duration: 500 });
        holding.value = 0;
        progress.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
      }
    }
  };

  const onPressIn = () => {
    if (starting || sealing.current) return;
    beat(Date.now());
    holding.value = 1;
    film.current?.playFromPositionAsync(Math.round(progress.value * HOLD_MS)).catch(() => {});
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
    // Let go almost at once: they tapped. Say to hold, gently.
    if (progress.value < 0.12) {
      haptics.warning();
      setTooShort(true);
      if (tooShortTimer.current) clearTimeout(tooShortTimer.current);
      tooShortTimer.current = setTimeout(() => setTooShort(false), 2600);
    }
    stopBeats();
    holding.value = 0;
    film.current?.pauseAsync().catch(() => {});
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  };

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

  // At rest the light flickers on the loop; once held, the cut itself moves.
  const restStyle = useAnimatedStyle(() => ({ opacity: progress.value > 0.001 ? 0 : 1 }));
  const duskStyle = useAnimatedStyle(() => ({
    opacity: Math.max(Math.pow(ramp(progress.value, DUSK.from, DUSK.to), DUSK.curve), footerOut.value),
  }));
  const filmStyle = useAnimatedStyle(() => ({ opacity: enter.value }));
  const wordsStyle = useAnimatedStyle(() => ({
    opacity: (1 - wordsOut.value) * ramp(enter.value, 0.4, 0.9),
    transform: [{ translateY: 8 * (1 - ramp(enter.value, 0.4, 0.9)) }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: (1 - footerOut.value) * ramp(enter.value, 0.6, 1),
  }));
  // The hold button breathes only while nobody is holding it.
  const holdStyle = useAnimatedStyle(() => {
    const idle = progress.value > 0.001 ? 0 : pulse.value;
    return {
      transform: [{ scale: 1 + 0.025 * idle }],
      borderColor: `rgba(248,240,230,${0.45 + 0.35 * idle})`,
    };
  });
  // Its fill follows the breath: full when the pledge is sealed.
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` as any }));
  const written = useDerivedValue(() => ramp(progress.value, WRITE.from, WRITE.to));

  // The logo: drawn at its middle size, scaled and carried to Home's top left.
  const logoH = LOGO_MID * LOCKUP_RATIO;
  // In the middle, unless the signed pledge reaches that high (small
  // phones): then above it, since both are on screen together now.
  const startLeft = (W - LOGO_MID) / 2;
  const startTop = Math.max(
    insets.top + 56,
    Math.min(H / 2 - logoH / 2, wordsTop === null ? Infinity : wordsTop - logoH - 40)
  );
  const s = LOGO_HOME / LOGO_MID;
  // Exactly where Home's logo sits (HOME_LOGO_TOP), so Home can take over with no jump.
  const endLeft = spacing.lg, endTop = insets.top + HOME_LOGO_TOP;
  const dx = endLeft + (LOGO_MID * s) / 2 - (startLeft + LOGO_MID / 2);
  const dy = endTop + (logoH * s) / 2 - (startTop + logoH / 2);
  const logoStyle = useAnimatedStyle(() => {
    const translateX = dx * move.value;
    const translateY = dy * move.value;
    const scale = (0.97 + 0.03 * logoIn.value) * (1 + (s - 1) * move.value);
    return { opacity: logoIn.value, transform: [{ translateX }, { translateY }, { scale }] as any };
  });

  const promise = timeValue === 0 ? "Apps blocked all day." : `${timeValue} min a day.`;

  return (
    <InkScreen
      variant="empty"
      onBack={starting || closing ? undefined : onBack}
      // Ivory: the tertiary grey disappears on the bright sky.
      topRight={closing ? undefined : <Caption tint={color.text}>{counter}</Caption>}
      footerBottom={36}
      // Over the grain, like Home's logo, so it lands looking the same.
      overlay={
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: startLeft, top: startTop }, logoStyle]}>
          <Lockup width={LOGO_MID} />
        </Animated.View>
      }
      backdrop={
        <>
          <Animated.View style={[StyleSheet.absoluteFill, filmStyle]}>
            <Video
              ref={film}
              source={SET}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              isMuted
            />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, restStyle]}>
              <Video
                source={REST}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
                rate={REST_RATE}
                onReadyForDisplay={startEnter}
              />
            </Animated.View>
            <LinearGradient colors={SHADE.colors} locations={SHADE.locations} style={StyleSheet.absoluteFill} />
            {/* Film grain on the film too (owner, 18 Nov 2026). */}
            <ImageBackground source={GRAIN} resizeMode="repeat" style={[StyleSheet.absoluteFill, styles.grain]} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dusk, duskStyle]} />
        </>
      }
      footer={
        <Animated.View style={[styles.footerWrap, footerStyle]}>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={starting || closing}
            accessibilityRole="button"
            accessibilityLabel="Hold to seal your pledge"
            accessibilityHint="Hold for four seconds. Sealing means you agree to the Terms and Privacy Policy."
            onAccessibilityAction={(e) => e.nativeEvent.actionName === "activate" && sealed()}
            accessibilityActions={[{ name: "activate" }]}
            style={styles.footer}
          >
            <Animated.View style={[styles.holdButton, holdStyle]}>
              <Animated.View style={[styles.holdFill, fillStyle]} />
              <Text style={styles.hold}>{tooShort ? "Keep holding to seal" : "Press and hold to seal"}</Text>
            </Animated.View>
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
        </Animated.View>
      }
    >
      {/* The whole screen is the control: press and hold anywhere, the sun
          sets. The signature line and the links keep their own taps. */}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={starting || closing}
        accessible={false}
        style={styles.content}
      >
        <Animated.View
          ref={wordsRef}
          onLayout={() => wordsRef.current?.measureInWindow((_x, y) => setWordsTop(y))}
          style={[styles.words, wordsStyle]}
        >
          {/* The promise in plain words (owner, 18 Nov 2026). */}
          <View style={styles.promise}>
            <Text style={styles.big}>{`${promise}\n${durationDays} days.`}</Text>
            <Text style={styles.pay}>
              {pledgeValue > 0 ? `or I pay ${CURRENCY_SYMBOL}${pledgeValue}.` : "On my word alone."}
            </Text>
          </View>
          {/* Signed, like a contract: the name writes itself as the seal is
              held (owner, 19 Nov 2026); tap the line to change it. */}
          <Pressable
            onPress={editName}
            accessibilityRole="button"
            accessibilityLabel={`Signature: ${name || "no name yet"}. Change the name`}
            style={styles.signature}
          >
            <View style={styles.inkRow}>
              {name ? (
                <SignatureInk name={name} progress={written} maxWidth={W - spacing.lg * 2} />
              ) : (
                <Text style={styles.noName}>Your name</Text>
              )}
            </View>
            <View style={styles.signLine} />
            <Text style={styles.signed}>{signedOn(new Date())}</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "flex-end", paddingBottom: 22 },
  words: { gap: 18 },
  promise: { gap: 6 },
  big: {
    fontFamily: fonts.uiSemibold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.95,
    color: color.text,
  },
  pay: {
    fontFamily: fonts.ui,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: color.text,
  },
  signature: { alignSelf: "flex-start", minWidth: 200, gap: 6 },
  // Room for the handwriting before it is written, so nothing moves as it appears.
  inkRow: { minHeight: 52, justifyContent: "flex-end" },
  noName: { fontFamily: fonts.ui, fontSize: 20, lineHeight: 24, color: color.textSecondary },
  signLine: { height: StyleSheet.hairlineWidth * 2, backgroundColor: "rgba(248,240,230,0.6)" },
  signed: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.54,
    color: "rgba(248,240,230,0.7)",
  },
  grain: { opacity: 0.35 },
  dusk: { backgroundColor: color.bg },
  footerWrap: { alignSelf: "stretch" },
  footer: { alignItems: "center", gap: 10, alignSelf: "stretch" },
  // A pill to hold: an ivory outline, filling with ivory as it is held.
  holdButton: {
    alignSelf: "stretch",
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(248,240,230,0.45)",
    backgroundColor: "rgba(248,240,230,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  holdFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(248,240,230,0.22)",
  },
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
