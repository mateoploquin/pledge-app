import React, { useCallback, useEffect, useRef, useState } from "react";
import Reanimated, {
  Easing as REasing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  Animated,
  Easing,
  useWindowDimensions,
  TextInput,
} from "react-native";
import {
  requestAuthorization,
  getAuthorizationStatus,
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity";
import * as Device from "expo-device";
import {
  SOCIAL_CUT_HEIGHT,
  SocialCut,
  isActivityReportAvailable,
} from "../../../../modules/pledge-activity-report";
import PillButton from "../../../components/ink/pill-button";
import Svg, {
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { color, fonts, type } from "../../../theme/tokens";
import { track } from "../../../services/analytics";

interface ScreenTimeMirrorProps {
  authorizationStatus: AuthorizationStatusType;
  setAuthorizationStatus: (status: AuthorizationStatusType) => void;
  /** The story has told its last number; Continue waits for it (owner, 18 Nov 2026). */
  onStoryEnd: () => void;
}

/**
 * Step: the mirror. Asks for Screen Time access the moment it opens, then
 * tells last week's Screen Time as a story, drawn by the system: a week in
 * hours, a month and a year in days, a lifetime in years. The user sees their
 * real numbers before being asked for anything.
 */
const ScreenTimeMirror: React.FC<ScreenTimeMirrorProps> = ({
  authorizationStatus,
  setAuthorizationStatus,
  onStoryEnd,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const reduceMotion = useReducedMotion();
  const drawnBySystem = isActivityReportAvailable() && Device.isDevice;
  const approvedNow = authorizationStatus === AuthorizationStatus.approved;

  // The system's report can't tell the app when its story ends, so on a
  // phone Continue opens when it should have: the story's length from now,
  // plus a second for iOS to start the extension. The app's own story
  // (AverageStory) says so itself.
  useEffect(() => {
    if (!approvedNow || !drawnBySystem) return;
    if (reduceMotion) {
      onStoryEnd();
      return;
    }
    const t = setTimeout(onStoryEnd, storyLengthMs() + 1000);
    return () => clearTimeout(t);
  }, [approvedNow, drawnBySystem, reduceMotion, onStoryEnd]);
  const asked = useRef(false);

  const requestAccess = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await requestAuthorization();
    } catch (error) {
      console.error("Error requesting Screen Time authorization:", error);
    } finally {
      setIsRequesting(false);
    }
    const status = getAuthorizationStatus();
    track("screen_time_authorization", {
      step: "mirror",
      approved: status === AuthorizationStatus.approved,
      status,
    });
    setAuthorizationStatus(status);
  }, [isRequesting, setAuthorizationStatus]);

  useEffect(() => {
    if (
      asked.current ||
      authorizationStatus !== AuthorizationStatus.notDetermined
    )
      return;
    asked.current = true;
    requestAccess();
  }, [authorizationStatus, requestAccess]);

  const onButtonPress = () => {
    if (authorizationStatus === AuthorizationStatus.denied) {
      Alert.alert(
        "Screen Time access needed",
        "Pledge can only show and limit your apps with Screen Time access. Turn it on in Settings and come back.",
        [
          { text: "Open Settings", onPress: Linking.openSettings },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    requestAccess();
  };

  const approved = authorizationStatus === AuthorizationStatus.approved;

  if (!approved) {
    return (
      <View style={styles.container}>
        <PillButton
          text={
            authorizationStatus === AuthorizationStatus.denied
              ? "Turn on Screen Time access"
              : "Allow Screen Time access"
          }
          tone="ghost"
          onPress={onButtonPress}
          busy={isRequesting}
        />
      </View>
    );
  }

  // The report is drawn by iOS in another process and the app can't see it.
  // Where iOS can't draw one (no extension, the simulator), the app draws the
  // average week itself, the same layout the extension uses when Screen Time
  // has no data (owner, 17 Nov 2026: never an empty page).
  if (!drawnBySystem) return <AverageStory onEnd={onStoryEnd} />;

  return (
    <View style={styles.container}>
      <SocialCut
        textColor={color.text}
        mutedColor={color.textSecondary}
        accentColor={color.solar}
        style={styles.overview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  overview: {
    alignSelf: "stretch",
  },
  story: { height: SOCIAL_CUT_HEIGHT, alignSelf: "stretch", paddingTop: 8 },
  pileCaption: type.caption,
  // The count is a read-only TextInput so the UI thread can set its text.
  pileCount: { padding: 0, margin: 0 },
  pileBox: { height: 160, marginTop: 10, overflow: "visible" }, // PILE_BOX
  pileSvg: { position: "absolute", top: 0, left: 0 },
  words: { marginTop: 18, gap: 4 },
  // Inter only, one shape for every beat (owner, 18 Nov 2026): a sentence
  // to the user that opens on the time frame, the number with its unit,
  // "on your phone."
  // A sentence to the user, the time frame in it bold and bright.
  lead: {
    fontFamily: fonts.ui,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.39,
    color: color.textSecondary,
  },
  frame: { fontFamily: fonts.uiSemibold, color: color.text },
  value: {
    fontFamily: fonts.uiSemibold,
    fontSize: 96,
    lineHeight: 108,
    letterSpacing: -4.8,
    color: color.text,
  },
  unit: { fontFamily: fonts.uiSemibold, fontSize: 44, letterSpacing: -0.88 },
  // "13 years": the number, then the one handwritten word on its baseline.
  lifeRow: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  // "Years": Inter like the rest of the page (owner, 18 Nov 2026), big.
  lifeUnit: {
    fontFamily: fonts.uiSemibold,
    fontSize: 64,
    letterSpacing: -1.9,
    color: color.text,
  },
  tail: {
    fontFamily: fonts.ui,
    fontSize: 20,
    lineHeight: 26,
    color: color.textSecondary,
  },
});

/**
 * About 3h 45m a day on a phone, the worldwide average (DataReportal 2024),
 * over an 80-year life. Keep in sync with averageDayHours and lifeYears in
 * targets/ReportExtension/SocialCut.swift, which draws the same thing.
 */
export const AVERAGE_DAY_HOURS = 3.75;
const LIFE_YEARS = 80;

const hoursParts = (h: number) => {
  if (h >= 1) {
    const n = Math.round(h);
    return { value: n, unit: n === 1 ? "hour" : "hours" };
  }
  const m = Math.max(1, Math.round(h * 60));
  return { value: m, unit: m === 1 ? "minute" : "minutes" };
};
const daysParts = (h: number) => {
  if (h < 24) return hoursParts(h);
  const d = Math.round(h / 24);
  return { value: d, unit: d === 1 ? "day" : "days" };
};
export const lifeParts = (h: number) => {
  const years = (h / 24) * LIFE_YEARS;
  if (years >= 1) {
    const y = Math.round(years);
    return { value: y, unit: y === 1 ? "year" : "years" };
  }
  const m = Math.max(1, Math.round(years * 12));
  return { value: m, unit: m === 1 ? "month" : "months" };
};

/**
 * The story's timings (owner, 18 Nov 2026: "dots, phrase, number, so that
 * the human can read it"). Each beat: the last words go, the squares grow,
 * then the phrase, then the number. Keep in sync with play() in
 * SocialCut.swift.
 */
const STORY = {
  /** After the screen has slid in, before the first squares. */
  startDelayMs: 300,
  outMs: 350,
  /** Squares growing to each beat: a week, a month, a year, a life. */
  growMs: [1600, 1700, 1700, 4500],
  /** Then the view pulls back until the whole life is on screen (owner,
   * 18 Nov 2026: "zoom out and see the magnitude of the dots"), the hours
   * gathering into days on the way (19 Nov 2026: crisp, never mush). */
  lifeZoomMs: 2400,
  /** A pause to take it in, then the squares fade. */
  lifePauseMs: 1200,
  lifeFadeMs: 1200,
  inMs: 500,
  /** From the phrase to the number. */
  numberAfterMs: 800,
  /** The number stays this long before the next beat starts. */
  holdMs: 2600,
  /**
   * The life is said slowly, with pauses (owner, 18 Nov 2026: "In your
   * life. Pause. Give a person time to understand what that means. That's
   * 13. Pause. Years on your phone."): "In your life." alone, then
   * "That's", the number, then "Years" big, then "on your phone."
   */
  life: { thatAfterMs: 2200, countAfterMs: 600, yearsAfterMs: 1800, yearsInMs: 1100, tailAfterMs: 1200 },
};

/**
 * From the story's start to its last number fully in: the four beats of
 * STORY, as play() in SocialCut.swift runs them.
 */
const storyLengthMs = () => {
  const s = STORY;
  const last = s.growMs.length - 1;
  let ms = s.startDelayMs;
  s.growMs.forEach((grow, i) => {
    if (i > 0) ms += s.outMs;
    ms += grow;
    if (i === last) ms += s.lifeZoomMs + s.lifePauseMs + s.lifeFadeMs;
    if (i < last) ms += s.numberAfterMs + s.inMs + s.holdMs;
    else {
      const l = s.life;
      ms += l.thatAfterMs + l.countAfterMs + l.yearsAfterMs + l.tailAfterMs + s.inMs;
    }
  });
  return ms;
};

/** Gap between squares, as a share of a square; at least 1 pt. */
const PILE_GAP = 0.16;
/** The pile's box above the words; a week is drawn at most 6 squares across. */
const PILE_BOX = 160;
const PILE_MIN_SIDE = 6;
/**
 * Every square and gap is whole points (owner, 19 Nov 2026: on a friend's
 * phone the grid looked blurry and uneven). The smallest step is a 4 pt
 * square with a 1 pt gap.
 */
const PILE_MIN_STEP = 5;
/** The life, pulled back, fits this tall under the caption. */
const PILE_ZOOM_HEIGHT = 400;
/** The smallest day step: a 2 pt square, 1 pt gap. */
const DAY_MIN_STEP = 3;
/** A day's square spans 5 hour steps each way (25 cells for its 24 hours). */
const DAY_CELL = 5;

/**
 * Where the life ends, pulled back (owner, 18 Nov 2026: "zoom out and see the
 * magnitude of the dots"): one square per day, whole points, as big as lets
 * the whole life fit `width` × PILE_ZOOM_HEIGHT. Hour squares that small were
 * grey mush, so on the way out the hours gather into days (owner, 19 Nov
 * 2026). Null when the hours already fit at the flood's step `flood` in rows
 * of `floodCols`. Same as Pile.dayGrid in SocialCut.swift.
 */
export const dayGrid = (
  hours: number,
  width: number,
  flood: number,
  floodCols: number
) => {
  if (width <= 0 || Math.ceil(hours / floodCols) * flood <= PILE_ZOOM_HEIGHT)
    return null;
  const days = Math.max(1, Math.round(hours / 24));
  let best = DAY_MIN_STEP;
  for (let d = DAY_MIN_STEP; d / DAY_CELL < flood; d++) {
    const c = Math.max(1, Math.floor(width / d));
    if (Math.ceil(days / c) * d <= PILE_ZOOM_HEIGHT) best = d;
  }
  return { step: best, cols: Math.max(1, Math.floor(width / best)), days };
};

/** How far the hours have turned into days, 0 to 1, over the middle of the
 * pull back (z already eased). Same as Pile.merge in SocialCut.swift. */
const mergeAt = (z: number) => {
  "worklet";
  const t = Math.min(1, Math.max(0, (z - 0.25) / 0.3));
  return t * t * (3 - 2 * t);
};

/** The life adds three stops between its phrase and its last words. */
type Phase = "out" | "grow" | "lead" | "that" | "count" | "years" | "number";

/**
 * The mirror's story (SocialCut.swift) told about most people, with the
 * average: a week, a month, a year, then a lifetime "OF YOUR Life." The
 * squares tell it first, then the words.
 */
const AverageStory: React.FC<{ onEnd: () => void }> = ({ onEnd }) => {
  const reduceMotion = useReducedMotion();
  const h = AVERAGE_DAY_HOURS;
  const week = hoursParts(h * 7);
  const month = daysParts(h * 30);
  const year = daysParts(h * 365);
  const life = lifeParts(h);
  // Told to the user, straight (owner, 18 Nov 2026: "look at the user dead
  // straight and show him his problem"; readers have no attention to spare).
  // Every beat opens on its time frame and ends "on your phone." Without
  // Screen Time data the numbers are the average.
  const tail = "on your phone.";
  const beats = [
    { frame: "This week", rest: ", you spent", ...week, tail },
    { frame: "This month", rest: ", you'll spend", ...month, tail },
    { frame: "This year", rest: ", you'll spend", ...year, tail },
    { frame: "In your life", rest: ".", ...life, tail },
  ];
  // Hours on the phone at each beat: a week, 30 days, 365 days, a life.
  const pile = [h * 7, h * 30, h * 365, h * 365 * LIFE_YEARS].map(Math.round);
  const last = beats.length - 1;

  const [beat, setBeat] = useState(reduceMotion ? last : 0);
  const [phase, setPhase] = useState<Phase>(reduceMotion ? "number" : "grow");

  // grow → (squares call onGrown) → lead → number → hold → out → next beat.
  useEffect(() => {
    if (reduceMotion) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const L = STORY.life;
    if (phase === "lead" && beat === last)
      t = setTimeout(() => setPhase("that"), L.thatAfterMs);
    else if (phase === "that")
      t = setTimeout(() => setPhase("count"), L.countAfterMs);
    else if (phase === "count")
      t = setTimeout(() => setPhase("years"), L.yearsAfterMs);
    else if (phase === "years")
      t = setTimeout(() => setPhase("number"), L.tailAfterMs);
    else if (phase === "lead")
      t = setTimeout(() => setPhase("number"), STORY.numberAfterMs);
    else if (phase === "number" && beat < last)
      t = setTimeout(() => setPhase("out"), STORY.holdMs);
    else if (phase === "out")
      t = setTimeout(() => {
        setBeat((b) => b + 1);
        setPhase("grow");
      }, STORY.outMs);
    return () => t && clearTimeout(t);
  }, [phase, beat, last, reduceMotion]);

  // The last number has come in: the story is told.
  useEffect(() => {
    if (beat !== last || phase !== "number") return;
    const t = setTimeout(onEnd, reduceMotion ? 0 : STORY.inMs);
    return () => clearTimeout(t);
  }, [beat, last, phase, reduceMotion, onEnd]);

  // The life's squares fade away before its words; then the pile makes way,
  // so the last words sit where the squares were, not under an empty box.
  const [pileGone, setPileGone] = useState(reduceMotion);
  const onGrown = useCallback(() => {
    if (beat === last) setPileGone(true);
    setPhase("lead");
  }, [beat, last]);
  const b = beats[beat];
  const order: Phase[] = ["lead", "that", "count", "years", "number"];
  const reached = (p: Phase) => order.indexOf(phase) >= order.indexOf(p);
  const showLead = reached("lead");
  const showNumber = phase === "number";

  return (
    <View style={styles.story}>
      {!pileGone && (
        <Pile
          counts={pile}
          beat={beat}
          duration={STORY.growMs[beat]}
          life={beat === last}
          reduceMotion={reduceMotion}
          onGrown={onGrown}
        />
      )}
      <View style={styles.words}>
        <Reveal shown={showLead} reduceMotion={reduceMotion}>
          <Text style={styles.lead}>
            <Text style={styles.frame}>{b.frame}</Text>
            {b.rest}
          </Text>
        </Reveal>
        {beat === last ? (
          // The life, said slowly: "That's" … 13 … years … on your phone.
          <>
            <Reveal shown={reached("that")} reduceMotion={reduceMotion}>
              <Text style={styles.lead}>That's</Text>
            </Reveal>
            <View style={styles.lifeRow}>
              <Reveal shown={reached("count")} reduceMotion={reduceMotion}>
                <Text style={styles.value}>{b.value}</Text>
              </Reveal>
              <Reveal
                shown={reached("years")}
                reduceMotion={reduceMotion}
                inMs={STORY.life.yearsInMs}
              >
                {/* "Years", capital Y (owner, 18 Nov 2026). */}
                <Text style={styles.lifeUnit}>
                  {b.unit.charAt(0).toUpperCase() + b.unit.slice(1)}
                </Text>
              </Reveal>
            </View>
            <Reveal shown={showNumber} reduceMotion={reduceMotion}>
              <Text style={styles.tail}>{b.tail}</Text>
            </Reveal>
          </>
        ) : (
          <Reveal shown={showNumber} reduceMotion={reduceMotion}>
            {/* One Text, so the unit sits on the number's baseline. */}
            <Text style={styles.value}>
              {b.value}
              <Text style={styles.unit}>{` ${b.unit}`}</Text>
            </Text>
            <Text style={styles.tail}>{b.tail}</Text>
          </Reveal>
        )}
      </View>
    </View>
  );
};

/**
 * Words that fade up when it's their turn and away when the beat ends. RN
 * Animated on the native driver, like Dissolve (ink/line.tsx). With Reduce
 * Motion the words simply show.
 */
const Reveal: React.FC<{
  shown: boolean;
  reduceMotion: boolean;
  /** How long it takes to come in (STORY.inMs unless said). */
  inMs?: number;
  children: React.ReactNode;
}> = ({ shown, reduceMotion, inMs = STORY.inMs, children }) => {
  const v = useRef(new Animated.Value(shown ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      v.setValue(shown ? 1 : 0);
      return;
    }
    Animated.timing(v, {
      toValue: shown ? 1 : 0,
      duration: shown ? inMs : STORY.outMs,
      easing: shown ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [shown, reduceMotion, inMs, v]);
  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

/**
 * Where the squares are, as row lengths. Each beat's pile is laid out in
 * rows of `cols[k]` squares (a near-square); the beat before it is a block
 * in its top-left corner, and the new squares fill the free cells row by
 * row. Every row is always a run from the left edge, so a row is one line,
 * and a square never moves once placed (owner, 18 Nov 2026: flawless).
 * Same function as pileRows in SocialCut.swift.
 */
export const pileRows = (
  counts: number[],
  cols: number[],
  k: number,
  n: number,
  maxRows: number
): number[] => {
  "worklet";
  const rows: number[] = [];
  // The block left by beat k - 1: rows of cols[k - 1], the last one short.
  if (k > 0) {
    let left = counts[k - 1];
    for (let y = 0; left > 0 && y < maxRows; y++) {
      rows.push(Math.min(left, cols[k - 1]));
      left -= cols[k - 1];
    }
  }
  let add = Math.max(0, Math.floor(n) - (k > 0 ? counts[k - 1] : 0));
  for (let y = 0; add > 0 && y < maxRows; y++) {
    const have = rows[y] ?? 0;
    const take = Math.min(cols[k] - have, add);
    rows[y] = have + take;
    add -= take;
  }
  return rows;
};

/**
 * The time, drawn (owner, 18 Nov 2026): one ivory square per hour on the
 * phone. A beat's squares fill in around the last beat's, row by row, while
 * the view pulls back to fit them in the box. At the year's size it stops
 * and the life floods down past the box, over where the words were, fading
 * before the bottom ("we feel, wow, that's a lot"); then the view pulls back
 * until the whole life shows, the hours gathering into days, one square a
 * day; then the squares fade away and the words come. Whole points. Drawn
 * as one dashed line per row, only the rows on screen. Same drawing as
 * PileShape in SocialCut.swift.
 */
const AnimatedPath = Reanimated.createAnimatedComponent(Path);
const AnimatedRect = Reanimated.createAnimatedComponent(Rect);
const AnimatedCount = Reanimated.createAnimatedComponent(TextInput);

const Pile: React.FC<{
  counts: number[];
  beat: number;
  duration: number;
  life: boolean;
  reduceMotion: boolean;
  onGrown: () => void;
}> = ({ counts, beat, duration, life, reduceMotion, onGrown }) => {
  const [width, setWidth] = useState(0);
  const screen = useWindowDimensions();
  const fade = useRef(new Animated.Value(reduceMotion && life ? 0 : 1)).current;
  // How far this beat's growth has got, 0 to 1. Animated on the UI thread
  // (Reanimated), and the squares are drawn there too: driven from JS, the
  // updates reached the screen in bursts and the count looked stuck, then
  // jumped (owner, 18 Nov 2026: flawless).
  const e = useSharedValue(reduceMotion ? 1 : 0);
  // The life's pull back, 0 (the flood) to 1 (every hour on screen).
  const zoom = useSharedValue(0);

  const fadeAway = useCallback(() => {
    Animated.timing(fade, {
      toValue: 0,
      delay: STORY.lifePauseMs,
      duration: STORY.lifeFadeMs,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start(() => onGrown());
  }, [onGrown, fade]);

  const finish = useCallback(() => {
    if (!life) {
      onGrown();
      return;
    }
    // The flood has filled the screen and the count has run to the end:
    // pull back until all of it is there, then let it go.
    zoom.value = withTiming(
      1,
      { duration: STORY.lifeZoomMs, easing: REasing.inOut(REasing.cubic) },
      (done) => {
        if (done) runOnJS(fadeAway)();
      }
    );
  }, [life, onGrown, fadeAway, zoom]);

  useEffect(() => {
    if (reduceMotion) return;
    e.value = 0;
    // The week's squares come one by one at a steady beat (an eased count
    // lands most of them in one lump in the middle). The life starts slow
    // and speeds up, so the screen fills over a few seconds and the count
    // then races on. The others grow in log steps, eased.
    const easing =
      beat === 0
        ? REasing.linear
        : life
        ? REasing.in(REasing.quad)
        : REasing.inOut(REasing.cubic);
    const grow = withTiming(1, { duration, easing }, (done) => {
      if (done) runOnJS(finish)();
    });
    // The first beat waits for the screen to finish sliding in.
    e.value = beat === 0 ? withDelay(STORY.startDelayMs + 400, grow) : grow;
  }, [beat, duration, life, reduceMotion, finish, e]);

  // Whole points, never under the smallest step; rounded down so a pile
  // that fits the box still fits.
  const snap = (v: number) => Math.max(Math.floor(v), PILE_MIN_STEP);
  // Each beat's step: its pile, a near-square, fits the box, at least 6
  // squares across.
  const near = counts.map((c) => Math.ceil(Math.sqrt(c)));
  const fits = near.map((c, k) =>
    width > 0
      ? Math.min(
          width / Math.max(c, PILE_MIN_SIDE),
          PILE_BOX / Math.max(Math.ceil(counts[k] / c), PILE_MIN_SIDE)
        )
      : 0
  );
  // The life floods on at the year's step, in rows the box's width.
  const last = counts.length - 1;
  const lastStep = width > 0 ? snap(fits[last - 1]) : PILE_MIN_STEP;
  const maxCols = width > 0 ? Math.max(1, Math.floor(width / lastStep)) : 1;
  const grid = dayGrid(counts[last], width, lastStep, maxCols);
  // A pile too tall for the box widens (up to the box's width). The life is
  // laid out on the grid it pulls back to, five hour columns per day column;
  // the flood shows its top-left corner, so pulling back moves no square.
  const cols = near.map((c, k) => {
    if (k === last) return grid ? grid.cols * DAY_CELL : maxCols;
    if (width <= 0) return c;
    const fitRows = Math.max(1, Math.floor(PILE_BOX / snap(fits[k])));
    return Math.min(Math.max(c, Math.ceil(counts[k] / fitRows)), maxCols);
  });
  const lifeShare = Math.max(1, Math.round(lastStep * PILE_GAP)) / lastStep;
  const floodH = SOCIAL_CUT_HEIGHT;
  const screenW = screen.width;
  const minStep = PILE_MIN_STEP;
  const gap = PILE_GAP;

  // The hour step while pulling back: from the flood's to a fifth of the
  // day step, so the hours cover the ground the days will.
  const lifeStep = (z: number) => {
    "worklet";
    if (!grid || z <= 0) return lastStep;
    const end = grid.step / DAY_CELL;
    if (z >= 1) return end;
    return Math.exp(Math.log(lastStep) + (Math.log(end) - Math.log(lastStep)) * z);
  };

  const hoursAt = (t: number) => {
    "worklet";
    // Exact at the end (exp/log can land a hair under, 1,368 for 1,369).
    if (t >= 1) return counts[beat];
    if (beat === 0) return counts[0] * t;
    const a = Math.log(counts[beat - 1]);
    return Math.exp(a + (Math.log(counts[beat]) - a) * t);
  };

  const pathProps = useAnimatedProps(() => {
    const t = e.value;
    const z = zoom.value;
    const merged = beat === last && grid ? mergeAt(z) : 0;
    if (width <= 0 || merged >= 1)
      return { d: "M0 0", strokeWidth: 0, strokeOpacity: 0, strokeDasharray: [1, 1] };
    // Whole points (the life's hours keep the flood's proportions as they
    // shrink, pulling back; they're days by the time they'd blur).
    let s: number;
    let cell: number;
    if (beat === last) {
      s = lifeStep(z);
      cell = s * (1 - lifeShare);
    } else {
      const raw =
        beat === 0
          ? fits[0]
          : Math.exp(
              Math.log(fits[beat - 1]) +
                (Math.log(fits[beat]) - Math.log(fits[beat - 1])) * t
            );
      s = Math.max(Math.floor(raw), minStep);
      cell = s - Math.max(1, Math.round(s * gap));
    }
    const visibleCols = Math.ceil(screenW / s);
    const rows = pileRows(
      counts,
      cols,
      beat,
      hoursAt(t),
      Math.ceil(floodH / s)
    );
    // Each row of squares is one dashed line, a dash per square: the dashes
    // start exactly where the row starts, so no square is ever cut.
    let d = "";
    for (let y = 0; y < rows.length; y++) {
      const count = Math.min(rows[y], visibleCols);
      if (count > 0) d += `M0 ${y * s + cell / 2}H${count * s - (s - cell)}`;
    }
    return {
      d: d || "M0 0",
      strokeWidth: d ? cell : 0,
      strokeOpacity: 1 - merged,
      strokeDasharray: [cell, s - cell],
    };
  });

  // The days the life's hours gather into, pulling back: five hour steps
  // each, landing on the day grid's whole points.
  const dayProps = useAnimatedProps(() => {
    const z = zoom.value;
    const merged = beat === last && grid ? mergeAt(z) : 0;
    if (!grid || merged <= 0)
      return { d: "M0 0", strokeWidth: 0, strokeOpacity: 0, strokeDasharray: [1, 1] };
    const s = z >= 1 ? grid.step : lifeStep(z) * DAY_CELL;
    const share = Math.max(1, Math.round(grid.step * gap)) / grid.step;
    const cell = s * (1 - share);
    const shown = Math.min(grid.cols, Math.ceil(screenW / s));
    const rowCount = Math.min(Math.ceil(grid.days / grid.cols), Math.ceil(floodH / s));
    let d = "";
    for (let y = 0; y < rowCount; y++) {
      const count = Math.min(shown, grid.days - y * grid.cols);
      if (count > 0) d += `M0 ${y * s + cell / 2}H${count * s - (s - cell)}`;
    }
    return {
      d: d || "M0 0",
      strokeWidth: d ? cell : 0,
      strokeOpacity: merged,
      strokeDasharray: [cell, s - cell],
    };
  });

  // Pulling back, the flood's fade at the bottom slides away so the whole
  // pile shows.
  const maskProps = useAnimatedProps(() => ({
    height: floodH * (1 + 3 * zoom.value),
  }));

  // When the hours gather into days the count dips and comes back in days.
  const countProps = useAnimatedProps(() => {
    const days = beat === last && grid ? mergeAt(zoom.value) >= 0.5 : false;
    const n = days && grid ? grid.days : Math.floor(hoursAt(e.value));
    const digits = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const unit = days ? (n === 1 ? "DAY" : "DAYS") : n === 1 ? "HOUR" : "HOURS";
    return {
      text: `${digits} ${unit} · ONE SQUARE, ONE ${days ? "DAY" : "HOUR"}`,
    } as any;
  });

  // Hidden until the first square.
  const countStyle = useAnimatedStyle(() => {
    const merged = beat === last && grid ? mergeAt(zoom.value) : 0;
    return {
      opacity:
        hoursAt(e.value) < 1
          ? 0
          : merged > 0
          ? Math.min(1, Math.abs(merged - 0.5) * 4)
          : 1,
    };
  });

  return (
    <Animated.View style={{ opacity: fade }}>
      <AnimatedCount
        editable={false}
        pointerEvents="none"
        defaultValue=""
        style={[styles.pileCaption, styles.pileCount, countStyle]}
        animatedProps={countProps}
      />
      <View
        style={styles.pileBox}
        onLayout={(ev) => setWidth(ev.nativeEvent.layout.width)}
      >
        <View style={styles.pileSvg} pointerEvents="none">
          <Svg width={screen.width} height={floodH}>
            <Defs>
              <LinearGradient id="floodFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.55" stopColor="#fff" stopOpacity={1} />
                <Stop offset="0.95" stopColor="#fff" stopOpacity={0} />
              </LinearGradient>
              <Mask
                id="flood"
                maskUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={screen.width}
                height={floodH}
              >
                <AnimatedRect
                  x={0}
                  y={0}
                  width={screen.width}
                  height={floodH}
                  fill="url(#floodFade)"
                  animatedProps={maskProps}
                />
              </Mask>
            </Defs>
            {/* The fade mask only for the life's flood. */}
            <G mask={life ? "url(#flood)" : undefined}>
              <AnimatedPath animatedProps={pathProps} stroke={color.text} />
              <AnimatedPath animatedProps={dayProps} stroke={color.text} />
            </G>
          </Svg>
        </View>
      </View>
    </Animated.View>
  );
};

export default ScreenTimeMirror;
