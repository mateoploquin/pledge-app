import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, InteractionManager, useWindowDimensions } from "react-native";
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

/**
 * What the limit gives back, one sentence (owner, 18 Nov 2026: "It has to be
 * OBVIOUS what it means. Anything else is noise."). On a phone the Screen
 * Time view draws it from last week's time on the chosen apps (TimeBackView
 * in targets/ReportExtension/TimeBack.swift). Where iOS can't draw one (no
 * extension, the simulator) the app draws the same from the average day,
 * 3 h 45 min.
 */
const TimeBackFallback: React.FC<{ minutes: number; gap: { marginTop: number } }> = ({ minutes, gap }) => {
  const back = Math.max(0, Math.round(AVERAGE_DAY_HOURS * 60) - minutes);
  const life = lifeParts(back / 60);
  return (
    <View style={[styles.back, gap]}>
      {back > 0 ? (
        <>
          <Text style={styles.backLead}>You get back</Text>
          <Text style={styles.lifeValue} numberOfLines={1} adjustsFontSizeToFit>
            {`${life.value} ${life.unit}`}
          </Text>
          <Text style={styles.backTail}>of your life.</Text>
        </>
      ) : (
        <Text style={styles.backLead}>You already stay under this.</Text>
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
  // The Screen Time view starts once the step has settled: started during
  // the step's dissolve, right after the mirror's report, it could come up
  // blank (one extension process serves both).
  const [reportReady, setReportReady] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      t = setTimeout(() => setReportReady(true), 400);
    });
    return () => {
      task.cancel();
      if (t) clearTimeout(t);
    };
  }, []);
  // Less air above the sentence on 667-pt screens (iPhone SE), so it clears the button.
  const gap = { marginTop: useWindowDimensions().height < 700 ? 16 : 40 };
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
        !reportReady ? (
          <View style={[styles.report, gap]} />
        ) : (
          <TimeBack
            familyActivitySelection={familyActivitySelection}
            limitMinutes={timeValue}
            textColor={color.text}
            mutedColor={color.textSecondary}
            accentColor={color.solar}
            style={[styles.report, gap]}
          />
        )
      ) : (
        <TimeBackFallback minutes={timeValue} gap={gap} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  report: { alignSelf: "stretch", height: TIME_BACK_HEIGHT, marginTop: 40 },
  back: { height: TIME_BACK_HEIGHT, marginTop: 40 },
  backLead: {
    fontFamily: fonts.ui,
    fontSize: 22,
    lineHeight: 28,
    color: color.textSecondary,
  },
  lifeValue: {
    fontFamily: fonts.uiSemibold,
    fontSize: 64,
    lineHeight: 76,
    letterSpacing: -1.6,
    color: color.text,
  },
  backTail: {
    fontFamily: fonts.ui,
    fontSize: 22,
    lineHeight: 28,
    color: color.text,
  },
  value: {
    ...type.value,
    marginBottom: 12,
  },
  unit: { ...type.row, color: color.textSecondary },
});

export default SetTimeLimit;
