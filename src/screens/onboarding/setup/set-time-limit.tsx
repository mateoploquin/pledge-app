import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";
import { color, fonts, type } from "../../../theme/tokens";
import { TIME_BACK_HEIGHT } from "../../../../modules/pledge-activity-report";
import { AVERAGE_DAY_HOURS, lifeParts } from "./screen-time-mirror";

interface SetTimeLimitProps {
  timeValue: number;
  setTimeValue: (value: number) => void;
  /** The apps chosen on the step before (base64), for the time-back picture. */
  familyActivitySelection: string | null;
}

/**
 * What the limit gives back, one sentence (owner, 18 Nov 2026: "It has to be
 * OBVIOUS what it means. Anything else is noise."). Drawn from the
 * average day, 3 h 45 min. The Screen Time version (TimeBackView in
 * targets/ReportExtension/TimeBack.swift, from last week's time on the
 * chosen apps) never showed on phones, so it isn't used (19 Nov 2026).
 */
const TimeBackFallback: React.FC<{ minutes: number }> = ({ minutes }) => {
  const back = Math.max(0, Math.round(AVERAGE_DAY_HOURS * 60) - minutes);
  const life = lifeParts(back / 60);
  return (
    <View style={styles.back}>
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
      {/* Drawn by the app, not the Screen Time view: on phones the system
          view never showed here (owner, 19 Nov 2026, several phones). */}
      <TimeBackFallback minutes={timeValue} />
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
