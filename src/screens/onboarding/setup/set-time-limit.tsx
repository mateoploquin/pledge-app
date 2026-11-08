import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";
import { color, fonts } from "../../../theme/tokens";

interface SetTimeLimitProps {
  timeValue: number;
  setTimeValue: (value: number) => void;
}

/** Step: minutes a day the apps stay open. Zero blocks them for the whole pledge. */
const SetTimeLimit: React.FC<SetTimeLimitProps> = ({ timeValue, setTimeValue }) => {
  return (
    <View style={styles.container}>
      {/* One text run, so the unit sits on the number's baseline (see set-pledge). */}
      <Text style={styles.value}>
        <AnimatedNumber value={timeValue} />
        <Text style={styles.unit}>{timeValue === 0 ? " blocked all day" : " min a day"}</Text>
      </Text>

      <SetSlider min={0} max={120} ticks={[0, 30, 60, 90, 120]} value={timeValue} onValueChange={setTimeValue} />

      <PresetChips
        values={[30, 60, 90]}
        selected={timeValue}
        onSelect={(v) => {
          haptics.select();
          setTimeValue(v);
        }}
        format={(v) => String(v)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  value: {
    fontFamily: fonts.uiSemibold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.9,
    color: color.text,
    fontVariant: ["tabular-nums"],
    marginBottom: 20,
  },
  unit: {
    fontFamily: fonts.ui,
    fontSize: 16,
    letterSpacing: 0,
    color: color.textSecondary,
  },
});

export default SetTimeLimit;
