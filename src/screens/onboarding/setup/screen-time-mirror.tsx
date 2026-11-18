import React, { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  Animated,
  Easing,
  useWindowDimensions,
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
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import { color, fonts, type } from "../../../theme/tokens";
import { track } from "../../../services/analytics";

interface ScreenTimeMirrorProps {
  authorizationStatus: AuthorizationStatusType;
  setAuthorizationStatus: (status: AuthorizationStatusType) => void;
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
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
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
  if (!isActivityReportAvailable() || !Device.isDevice) return <AverageStory />;

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
  zoomOrigin: { transformOrigin: "left center" },
  story: { height: SOCIAL_CUT_HEIGHT, alignSelf: "stretch", paddingTop: 16 },
  beatArea: { flex: 1, gap: 4 },
  pile: { gap: 10 },
  pileBox: { height: 128, overflow: "visible" }, // PILE_HEIGHT
  pileSvg: { position: "absolute", top: 0, left: 0 },
  pileCaption: type.caption,
  lead: {
    fontFamily: fonts.ui,
    fontSize: 20,
    lineHeight: 26,
    color: color.textSecondary,
  },
  value: {
    fontFamily: fonts.uiSemibold,
    fontSize: 112,
    lineHeight: 128,
    letterSpacing: -5.6,
    color: color.text,
  },
  unit: { fontFamily: fonts.uiMedium, fontSize: 36, letterSpacing: -0.72 },
  // Great Vibes' capital L rises to 1.15 em, well above its 0.85 em ascent;
  // a tall line box keeps the top of the L from being cut off.
  lifeLine: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 96,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: color.text,
  },
  lifeWord: {
    fontFamily: fonts.script,
    fontSize: 60,
    letterSpacing: 0,
    textTransform: "none",
    color: color.text,
  },
});

/**
 * About 3h 45m a day on a phone, the worldwide average (DataReportal 2024),
 * over an 80-year life. Keep in sync with averageDayHours and lifeYears in
 * targets/ReportExtension/SocialCut.swift, which draws the same thing.
 */
const AVERAGE_DAY_HOURS = 3.75;
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
const lifeParts = (h: number) => {
  const years = (h / 24) * LIFE_YEARS;
  if (years >= 1) {
    const y = Math.round(years);
    return { value: y, unit: y === 1 ? "year" : "years" };
  }
  const m = Math.max(1, Math.round(years * 12));
  return { value: m, unit: m === 1 ? "month" : "months" };
};

/** About 3.2 s a beat, as in SocialCut.swift; the last one stays. */
const BEAT_MS = 3200;

/**
 * The mirror's story (SocialCut.swift) told about most people, with the
 * average: a week, a month, a year, then a lifetime "OF YOUR Life."
 */
const AverageStory: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const h = AVERAGE_DAY_HOURS;
  const week = hoursParts(h * 7);
  const month = daysParts(h * 30);
  const year = daysParts(h * 365);
  const life = lifeParts(h);
  const beats = [
    { lead: "Most people spend", ...week, tail: "a week on their phone." },
    { lead: "In a month, that's", ...month, tail: "looking down." },
    { lead: "In a year, it adds up to", ...year, tail: "" },
    // No lead on the last beat (owner, 18 Nov 2026): the number speaks.
    { lead: "", ...life, tail: "" },
  ];
  const last = beats.length - 1;
  const [beat, setBeat] = useState(reduceMotion ? last : 0);
  useEffect(() => {
    if (beat >= last) return;
    const t = setTimeout(() => setBeat(beat + 1), BEAT_MS);
    return () => clearTimeout(t);
  }, [beat, last]);
  const b = beats[beat];
  // Hours on the phone at each beat: a week, 30 days, 365 days, a life.
  const pile = [h * 7, h * 30, h * 365, h * 365 * LIFE_YEARS];
  return (
    <View style={styles.story}>
      <ZoomOut id={beat} reduceMotion={reduceMotion} style={styles.beatArea}>
        {/* A blank lead keeps the number where the other beats put it. */}
        <Text style={styles.lead}>{b.lead || " "}</Text>
        {/* One Text, so the unit sits on the number's baseline. */}
        <Text style={styles.value}>
          {b.value}
          <Text style={styles.unit}>{` ${b.unit}`}</Text>
        </Text>
        {beat === last ? (
          // "Life." in manuscript, ivory (owner, 18 Nov 2026); one Text so it shares the baseline.
          <Text style={styles.lifeLine}>
            {"Of your "}
            <Text style={styles.lifeWord}>Life.</Text>
          </Text>
        ) : b.tail ? (
          <Text style={styles.lead}>{b.tail}</Text>
        ) : null}
      </ZoomOut>
      <Pile
        hours={pile[beat]}
        duration={beat === last ? PILE_LIFE_MS : PILE_MS}
        reduceMotion={reduceMotion}
      />
    </View>
  );
};

/** How long the pile takes to grow to a beat (the life takes longer); as in SocialCut.swift. */
const PILE_MS = 1700;
const PILE_LIFE_MS = 5000;
/** After the life has grown: a beat to take it in, then the squares fade away. */
const PILE_FADE_DELAY_MS = 900;
const PILE_FADE_MS = 1400;
/** Gap between squares, as a share of a square. */
const PILE_GAP = 0.16;
/** The pile's box; a week is drawn at most 6 squares across. */
const PILE_HEIGHT = 128;
const PILE_MIN_SIDE = 6;
/** The camera stops pulling back when a square is this small (about a year in the box). */
const PILE_MIN_SQUARE = 5;

/**
 * The time, drawn (owner, 18 Nov 2026): one square per hour on the phone,
 * in rows of a near-square, filled like a calendar. Through the week, the month and the year the view pulls back to
 * fit the pile in its box. Then it stops, squares still visible, and the
 * life keeps growing past the box, down and off the screen (owner: "the
 * point is that we feel, wow, that's a lot"; a solid block undersold it).
 * Grows in log steps. Drawn as at most two rectangles filled with a
 * one-square pattern, so a hundred thousand squares cost no more than ten.
 * Same drawing as PileShape in SocialCut.swift.
 */
const Pile: React.FC<{
  hours: number;
  duration: number;
  reduceMotion: boolean;
}> = ({ hours, duration, reduceMotion }) => {
  const [n, setN] = useState(hours);
  const nRef = useRef(hours);
  const [width, setWidth] = useState(0);
  const screen = useWindowDimensions();
  const life = duration === PILE_LIFE_MS;
  // Once the life has grown, the squares and their count fade away and the words stay
  // (owner, 18 Nov 2026: the full screen of squares was a weird place to end).
  const fade = useRef(new Animated.Value(1)).current;
  const fadeAway = useCallback(
    (now: boolean) => {
      if (now) fade.setValue(0);
      else
        Animated.timing(fade, {
          toValue: 0,
          delay: PILE_FADE_DELAY_MS,
          duration: PILE_FADE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
    },
    [fade]
  );

  useEffect(() => {
    const from = nRef.current;
    if (reduceMotion || from === hours || from <= 0) {
      nRef.current = hours;
      setN(hours);
      if (life) fadeAway(true);
      return;
    }
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const x = Math.min((Date.now() - t0) / duration, 1);
      // The life starts slow and speeds up, so the screen fills over a few
      // seconds and the count then races on past what can be shown.
      const e =
        duration === PILE_LIFE_MS
          ? x * x
          : x < 0.5
          ? 4 * x * x * x
          : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const v = Math.exp(
        Math.log(from) + (Math.log(hours) - Math.log(from)) * e
      );
      nRef.current = v;
      setN(v);
      if (x < 1) raf = requestAnimationFrame(tick);
      else if (life) fadeAway(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hours, duration, life, reduceMotion, fadeAway]);

  const whole = Math.max(1, Math.floor(n));
  const side = Math.max(Math.sqrt(whole), PILE_MIN_SIDE);
  // Whole points only: at fractional sizes the SVG pattern's tiles drift
  // against the rectangles' edges and leave slivers of squares at the edges.
  const s =
    width > 0
      ? Math.max(
          Math.floor(Math.min(width / side, PILE_HEIGHT / side)),
          PILE_MIN_SQUARE
        )
      : 0;
  // Rows of a near-square, filled left to right like a calendar: only the
  // last row is ever short (owner, 18 Nov 2026: squares sticking out on the
  // side looked broken).
  const cols = Math.ceil(Math.sqrt(whole));
  const fullRows = Math.floor(whole / cols);
  const rest = whole - fullRows * cols;
  const cell = s * (1 - PILE_GAP);
  const rounded = Math.round(n).toLocaleString("en-US");

  return (
    <Animated.View style={[styles.pile, { opacity: fade }]}>
      <Text style={styles.pileCaption}>
        {rounded} {rounded === "1" ? "hour" : "hours"} · one square, one hour
      </Text>
      <View
        style={styles.pileBox}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {/* Big enough to run off the bottom and right of the screen. */}
        <View style={styles.pileSvg} pointerEvents="none">
          <Svg width={screen.width} height={screen.height} pointerEvents="none">
            <Defs>
              <Pattern
                id="hour"
                patternUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={s}
                height={s}
              >
                <Rect
                  width={cell}
                  height={cell}
                  rx={Math.min(cell * 0.2, 3)}
                  fill={color.solar}
                />
              </Pattern>
            </Defs>
            {s > 0 && (
              <>
                <Rect
                  x={0}
                  y={0}
                  width={cols * s}
                  height={fullRows * s}
                  fill="url(#hour)"
                />
                {rest > 0 && (
                  <Rect
                    x={0}
                    y={fullRows * s}
                    width={rest * s}
                    height={s}
                    fill="url(#hour)"
                  />
                )}
              </>
            )}
          </Svg>
        </View>
      </View>
    </Animated.View>
  );
};

/** Zoom-out timings; keep in sync with play() in SocialCut.swift. */
const ZOOM = { outMs: 450, inMs: 800, from: 1.3, to: 0.7, drift: 0.95 };

/**
 * The story pulls back like a camera (owner, 18 Nov 2026: "keep zooming
 * out"): each beat drifts smaller while it's read, then shrinks away as the
 * next one arrives from bigger, a week, a month, a year, a life. Scaled from
 * the left edge, where the text starts. The first beat is visible from the
 * first frame (see Dissolve in ink/line.tsx for why); Reduce Motion cuts.
 */
const ZoomOut: React.FC<{
  id: number;
  reduceMotion: boolean;
  style?: any;
  children: React.ReactNode;
}> = ({ id, reduceMotion, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(id);
  // The outgoing beat stays on screen, frozen, while it shrinks away.
  const content = useRef(children);
  if (shown === id) content.current = children;

  const drift = useCallback(
    () =>
      Animated.timing(scale, {
        toValue: ZOOM.drift,
        duration: BEAT_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    [scale]
  );

  useEffect(() => {
    if (!reduceMotion) drift().start();
  }, [drift, reduceMotion]);

  useEffect(() => {
    if (id === shown) return;
    if (reduceMotion) {
      setShown(id);
      return;
    }
    let stale = false;
    const out = {
      duration: ZOOM.outMs,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    };
    Animated.parallel([
      Animated.timing(scale, { toValue: ZOOM.to, ...out }),
      Animated.timing(opacity, { toValue: 0, ...out }),
    ]).start(() => {
      if (stale) return;
      setShown(id);
      scale.setValue(ZOOM.from);
      const into = {
        duration: ZOOM.inMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      };
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, ...into }),
          Animated.timing(opacity, { toValue: 1, ...into }),
        ]),
        drift(),
      ]).start();
    });
    return () => {
      stale = true;
    };
  }, [id, shown, reduceMotion, scale, opacity, drift]);

  return (
    <Animated.View
      style={[style, styles.zoomOrigin, { opacity, transform: [{ scale }] }]}
    >
      <React.Fragment key={shown}>{content.current}</React.Fragment>
    </Animated.View>
  );
};

export default ScreenTimeMirror;
