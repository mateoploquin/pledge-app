import React, { useState } from "react";
import { View, Text, StyleSheet, PixelRatio } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";
import { color, fonts, type } from "../../../theme/tokens";
import * as Device from "expo-device";
import {
  TIME_BACK_HEIGHT,
  TimeBack,
  isActivityReportAvailable,
} from "../../../../modules/pledge-activity-report";
import { AVERAGE_DAY_HOURS, lifeParts } from "./screen-time-mirror";

interface SetTimeLimitProps {
  timeValue: number;
  setTimeValue: (value: number) => void;
  /** The apps chosen on the step before (base64), for the time-back picture. */
  familyActivitySelection: string | null;
}

/** Sixteen squares to a row, one per 15 minutes. */
const DAY_COLS = 16;
const SQUARE_MIN = 15;
const GAP = 4;

const hm = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`;
};

/**
 * What the limit gives back (owner, 18 Nov 2026: personalised to the
 * mirror, "how many years of my life I'm getting back"). On a phone the
 * Screen Time view draws it from last week's time on the chosen apps
 * (TimeBackView in targets/ReportExtension/TimeBack.swift). Where iOS can't
 * draw one (no extension, the simulator) the app draws the same with the
 * average day, 3 h 45 min.
 */
const TimeBackFallback: React.FC<{ minutes: number }> = ({ minutes }) => {
  const perDay = Math.round(AVERAGE_DAY_HOURS * 60);
  const squares = Math.min(Math.ceil(perDay / SQUARE_MIN), 64);
  const kept = Math.min(Math.ceil(minutes / SQUARE_MIN), squares);
  const back = Math.max(0, perDay - minutes);
  const life = lifeParts(back / 60);
  const [width, setWidth] = useState(0);
  const px = PixelRatio.get();
  const size =
    width > 0
      ? Math.floor(((width - GAP * (DAY_COLS - 1)) / DAY_COLS) * px) / px
      : 0;
  return (
    <View
      style={styles.back}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Text style={styles.backCaption}>An average day: {hm(perDay)}</Text>
      <View style={styles.grid}>
        {Array.from({ length: squares }, (_, i) => (
          <View
            key={i}
            style={[
              { width: size, height: size },
              styles.square,
              i < kept && styles.kept,
            ]}
          />
        ))}
      </View>
      {back > 0 ? (
        <>
          <Text style={styles.backLine}>
            <Text style={styles.strong}>{hm(back)}</Text> a day back.
          </Text>
          <Text style={styles.lifeLine}>
            <Text style={styles.lifeValue}>{`${life.value} ${life.unit}`}</Text>{" "}
            of your life, back.
          </Text>
        </>
      ) : (
        <Text style={styles.backLine}>You already stay under this.</Text>
      )}
    </View>
  );
};

/** Step: minutes a day the apps stay open. Zero blocks them for the whole pledge. */
const SetTimeLimit: React.FC<SetTimeLimitProps> = ({
  timeValue,
  setTimeValue,
  familyActivitySelection,
}) => {
  return (
    <View style={styles.container}>
      {/* One text run, so the unit sits on the number's baseline (see set-pledge). */}
      <Text style={styles.value}>
        <AnimatedNumber value={timeValue} />
        {/* An en space is 8 pt at 16 pt: Paper B4's gap between number and unit. */}
        <Text style={styles.unit}>
          {timeValue === 0 ? "\u2002blocked all day" : "\u2002min a day"}
        </Text>
      </Text>

      <SetSlider
        min={0}
        max={120}
        ticks={[0, 30, 60, 90, 120]}
        value={timeValue}
        onValueChange={setTimeValue}
      />

      <PresetChips
        values={[30, 60, 90]}
        selected={timeValue}
        onSelect={(v) => {
          haptics.select();
          setTimeValue(v);
        }}
        format={(v) => String(v)}
      />

      {/* The choice first, what it gives back under it (owner, 18 Nov 2026:
          make it obvious what to do). */}
      {isActivityReportAvailable() && Device.isDevice ? (
        <TimeBack
          familyActivitySelection={familyActivitySelection}
          limitMinutes={timeValue}
          textColor={color.text}
          mutedColor={color.textSecondary}
          accentColor={color.solar}
          style={styles.report}
        />
      ) : (
        <TimeBackFallback minutes={timeValue} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  report: { alignSelf: "stretch", height: TIME_BACK_HEIGHT, marginTop: 40 },
  back: { height: TIME_BACK_HEIGHT, marginTop: 40, gap: 10 },
  backCaption: type.caption,
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  square: { backgroundColor: color.text },
  kept: { opacity: 0.16 },
  backLine: {
    fontFamily: fonts.ui,
    fontSize: 20,
    lineHeight: 26,
    color: color.textSecondary,
    marginTop: 8,
  },
  strong: { fontFamily: fonts.uiSemibold, color: color.text },
  lifeLine: {
    fontFamily: fonts.ui,
    fontSize: 20,
    lineHeight: 48,
    color: color.textSecondary,
  },
  lifeValue: {
    fontFamily: fonts.uiSemibold,
    fontSize: 44,
    letterSpacing: -0.88,
    color: color.text,
  },
  value: {
    ...type.value,
    marginBottom: 12,
  },
  unit: { ...type.row, color: color.textSecondary },
});

export default SetTimeLimit;
