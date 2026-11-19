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
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import InkScreen from "../../../components/ink/ink-screen";
import Caption from "../../../components/ink/caption";
import Lockup from "../../../components/ink/lockup";
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
 * scripts/make-seal-clips.swift): at rest, its first 4 s at real speed played
 * forward and back, a seamless 8 s loop, so the sun shimmers and the screen
 * is alive before it's touched; held, the sun sinking until its bottom edge
 * meets the sea (the footage's first 12 s) in one breath, 4 s at 30 fps,
 * every frame a keyframe so letting go can scrub it back.
 */
const IDLE = require("../../../../assets/video/seal-idle.mp4");
const SET = require("../../../../assets/video/seal-set.mp4");
const GRAIN = require("../../../../assets/textures/grain.png");
/** The held cut's last frame: the sun that travels into the logo. */
const SUN = require("../../../../assets/video/seal-sun.jpg");

/**
 * Where things are in the footage (720 × 1080) on the held cut's last
 * frame: the horizon, and the sun as a disc resting on it. Measured from
 * the clip; the closing animation starts exactly on that sun.
 */
const FOOTAGE = { w: 720, h: 1080, horizon: 720, sunX: 337, sunR: 250 };
/**
 * The film is raised by this share of the screen height so the horizon sits
 * at about 56% of the screen and every word sits on the dark sea (owner,
 * 18 Nov 2026: "all the text needs to be in the dark part").
 */
const FILM_LIFT = 0.32;

/** The closing animation (owner, 18 Nov 2026: the sun "turns into the logo and then the main menu appears"). */
const CLOSE = {
  /** The sun shrinks into the mark (the film fades as it goes). */
  fadeMs: 0,
  settleMs: 1600,
  /** Then the wordmark. */
  wordMs: 500,
  /** A beat on the finished logo before Home. */
  holdMs: 500,
};

/** The Pledge lockup's geometry (components/ink/lockup.tsx, viewBox 1600 × 420). */
const LOCKUP = { w: 1600, h: 420, cx: 275, cy: 160, r: 105, lineL: 50, lineR: 500, lineY: 265, line: 6 };
/** How wide the logo is drawn at the end. */
const LOGO_W = 240;

/** A touch of dark under the status bar and back chevron, and more over the sea so the words read. */
const SHADE = {
  colors: [
    "rgba(20,12,11,0.45)",
    "rgba(20,12,11,0)",
    "rgba(20,12,11,0)",
    "rgba(20,12,11,0.55)",
  ] as const,
  locations: [0, 0.14, 0.6, 1] as const,
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const signedOn = (d: Date) => `SIGNED ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

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
 * the screen; on the dark sea below it, the promise in plain words ("30 min
 * a day. 30 days. or I pay $10.") and the user's name on a signature line
 * (owner, 18 Nov 2026: the signature and the simple wording). Tap the name
 * to change it. Press and hold anywhere for one breath (4 s): the sun sinks
 * until it touches the horizon, haptics building; let go early and it rises
 * back. Then the sun becomes the logo, an ivory disc on a line, the wordmark
 * joins it, and Home follows. Holding it through agrees to the terms and
 * starts the pledge.
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
  const progress = useSharedValue(0);
  // While held the film plays on its own; otherwise it follows `progress` (the sink).
  const holding = useSharedValue(0);
  // The closing animation: 0 → 1 the sun becomes the mark; then the wordmark.
  const close = useSharedValue(0);
  const word = useSharedValue(0);
  const [closing, setClosing] = useState(false);
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

  // The film, raised and scaled to cover: where its horizon and sun land.
  const lift = H * FILM_LIFT;
  const scale = Math.max(W / FOOTAGE.w, (H + lift) / FOOTAGE.h);
  const ox = (W - FOOTAGE.w * scale) / 2;
  const oy = -lift + (H + lift - FOOTAGE.h * scale) / 2;
  const horizonY = oy + FOOTAGE.horizon * scale;
  const sun = {
    x: ox + FOOTAGE.sunX * scale,
    r: FOOTAGE.sunR * scale,
  };
  // The logo, centred, at its final size.
  const k = LOGO_W / LOCKUP.w;
  const logoLeft = (W - LOGO_W) / 2;
  const logoTop = H / 2 - (LOCKUP.h * k) / 2;
  const mark = {
    x: logoLeft + LOCKUP.cx * k,
    r: LOCKUP.r * k,
    lineL: logoLeft + LOCKUP.lineL * k,
    lineR: logoLeft + LOCKUP.lineR * k,
    lineY: logoTop + LOCKUP.lineY * k,
    line: LOCKUP.line * k,
  };

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

  /** The sun becomes the logo; resolves when the logo has had its beat. */
  const playClose = () => {
    setClosing(true);
    close.value = withTiming(1, {
      duration: CLOSE.fadeMs + CLOSE.settleMs,
      easing: Easing.linear,
    });
    word.value = withDelay(
      CLOSE.fadeMs + CLOSE.settleMs,
      withTiming(1, { duration: CLOSE.wordMs, easing: Easing.out(Easing.cubic) })
    );
    return new Promise<void>((resolve) =>
      setTimeout(resolve, CLOSE.fadeMs + CLOSE.settleMs + CLOSE.wordMs + CLOSE.holdMs)
    );
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
        word.value = withTiming(0, { duration: 300 });
        close.value = withTiming(0, { duration: 500 });
        holding.value = 0;
        progress.value = withTiming(0, {
          duration: 700,
          easing: Easing.out(Easing.cubic),
        });
      }
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

  // One continuous move (owner, 18 Nov 2026: the sun "turns into the
  // logo"): the sky fades where it is while the sun, cut out as a disc from
  // the held cut's last frame, shrinks and is carried to where the mark's
  // disc sits; as it gets small an ivory disc takes over from the photograph,
  // and the horizon becomes the mark's line. `close` runs 0 → 1; the
  // geometry eases in and out.
  const sunCY = horizonY - sun.r;
  const markCY = mark.lineY - mark.r;
  const endScale = mark.r / sun.r;
  const ease = (t: number) => {
    "worklet";
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  const geometry = (t: number) => {
    "worklet";
    const g = ease(t);
    // Scale shrinks geometrically, so it feels like one steady pull.
    const sc = Math.exp(Math.log(endScale) * g);
    const cx = sun.x + (mark.x - sun.x) * g;
    const cy = sunCY + (markCY - sunCY) * g;
    return { g, sc, cx, cy };
  };
  // The sky stays where it is and fades; only the sun travels.
  const filmStyle = useAnimatedStyle(() => ({
    opacity: 1 - interpolate(close.value, [0, 0.3], [0, 1], "clamp"),
  }));
  // The travelling sun: a round window onto the held cut's last frame,
  // shrinking about the sun and carried to the mark.
  const sunWindowStyle = useAnimatedStyle(() => {
    const { sc, cx, cy } = geometry(close.value);
    const r = sun.r * sc;
    return {
      opacity: close.value > 0 ? 1 - interpolate(close.value, [0.55, 0.85], [0, 1], "clamp") : 0,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      left: cx - r,
      top: cy - r,
    };
  });
  const sunImageStyle = useAnimatedStyle(() => {
    const { sc } = geometry(close.value);
    const s2 = scale * sc;
    const r = sun.r * sc;
    return {
      width: FOOTAGE.w * s2,
      height: FOOTAGE.h * s2,
      // Place the frame so its sun sits in the middle of the window.
      left: r - FOOTAGE.sunX * s2,
      top: r - (FOOTAGE.horizon - FOOTAGE.sunR) * s2,
    };
  });
  const wordsStyle = useAnimatedStyle(() => ({
    opacity: 1 - interpolate(close.value, [0, 0.15], [0, 1], "clamp"),
  }));
  const discStyle = useAnimatedStyle(() => {
    const { sc, cx, cy } = geometry(close.value);
    const r = sun.r * sc;
    return {
      opacity: interpolate(close.value, [0.45, 0.8], [0, 1], "clamp"),
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      left: cx - r,
      top: cy - r,
    };
  });
  const lineStyle = useAnimatedStyle(() => {
    const { g, sc, cy } = geometry(close.value);
    const l = mark.lineL * g;
    const r = W + (mark.lineR - W) * g;
    // The line stays under the disc.
    const y = cy + sun.r * sc;
    const th = 1.5 + (mark.line - 1.5) * g;
    return {
      opacity: interpolate(close.value, [0.2, 0.6], [0, 1], "clamp"),
      left: l,
      width: r - l,
      top: y - th / 2,
      height: th,
    };
  });
  const lockupStyle = useAnimatedStyle(() => ({ opacity: word.value }));

  const promise =
    timeValue === 0 ? "Apps blocked all day." : `${timeValue} min a day.`;

  return (
    <InkScreen
      variant="empty"
      onBack={starting || closing ? undefined : onBack}
      // Ivory: the tertiary grey disappears on the bright sky.
      topRight={closing ? undefined : <Caption tint={color.text}>{counter}</Caption>}
      footerBottom={36}
      backdrop={
        <>
          <Animated.View style={[StyleSheet.absoluteFill, filmStyle]}>
            {/* Raised so the horizon sits above the words. */}
            <View style={{ position: "absolute", left: 0, right: 0, top: -lift, height: H + lift }}>
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
            {/* Film grain on the film too (owner, 18 Nov 2026). */}
            <ImageBackground
              source={GRAIN}
              resizeMode="repeat"
              style={[StyleSheet.absoluteFill, styles.grain]}
            />
          </Animated.View>
          {/* The photographed sun, travelling. */}
          <Animated.View pointerEvents="none" style={[styles.sunWindow, sunWindowStyle]}>
            <Animated.Image source={SUN} style={[styles.sunImage, sunImageStyle]} />
          </Animated.View>
          {/* The sun as the mark: a disc resting on the horizon line. */}
          <Animated.View pointerEvents="none" style={[styles.disc, discStyle]} />
          <Animated.View pointerEvents="none" style={[styles.line, lineStyle]} />
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", left: logoLeft, top: logoTop }, lockupStyle]}
          >
            <Lockup width={LOGO_W} />
          </Animated.View>
        </>
      }
      footer={
        <Animated.View style={wordsStyle}>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={starting || closing}
            accessibilityRole="button"
            accessibilityLabel="Hold to seal your pledge"
            accessibilityHint="Hold for four seconds. Sealing means you agree to the Terms and Privacy Policy."
            onAccessibilityAction={(e) =>
              e.nativeEvent.actionName === "activate" && sealed()
            }
            accessibilityActions={[{ name: "activate" }]}
            style={styles.footer}
          >
            <Text style={styles.hold}>Press and hold to seal</Text>
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
          sets. The name and the links keep their own taps. */}
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={starting || closing}
        accessible={false}
        style={styles.content}
      >
        <Animated.View style={[styles.words, wordsStyle]}>
          {/* The promise in plain words (owner, 18 Nov 2026). */}
          <View style={styles.promise}>
            <Text style={styles.big}>{`${promise}\n${durationDays} days.`}</Text>
            <Text style={styles.pay}>{`or I pay ${CURRENCY_SYMBOL}${pledgeValue}.`}</Text>
          </View>
          {/* Signed, like a contract; tap the name to change it. */}
          <Pressable
            onPress={editName}
            accessibilityRole="button"
            accessibilityLabel={`Signed ${name || "your name"}. Change the name`}
            style={styles.signature}
          >
            <Text style={[styles.name, !name && styles.noName]}>{name || "Your name"}</Text>
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
  signature: { alignSelf: "flex-start", width: 200, gap: 6 },
  name: { fontFamily: fonts.ui, fontSize: 20, lineHeight: 24, color: color.text },
  noName: { color: color.textSecondary },
  signLine: { height: StyleSheet.hairlineWidth * 2, backgroundColor: "rgba(248,240,230,0.6)" },
  signed: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.54,
    color: "rgba(248,240,230,0.7)",
  },
  grain: { opacity: 0.35 },
  disc: { position: "absolute", backgroundColor: color.text },
  sunWindow: { position: "absolute", overflow: "hidden" },
  sunImage: { position: "absolute" },
  line: { position: "absolute", backgroundColor: color.text },
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
