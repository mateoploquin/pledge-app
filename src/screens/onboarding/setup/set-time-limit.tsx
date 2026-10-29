import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";
import { cream, fonts } from "../../../theme/tokens";

interface SetTimeLimitProps {
  timeValue: number;
  setTimeValue: (value: number) => void;
}

/** Step: minutes a day the apps stay open. Zero blocks them for the whole pledge. */
const SetTimeLimit: React.FC<SetTimeLimitProps> = ({ timeValue, setTimeValue }) => {
  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <AnimatedNumber style={styles.value} value={timeValue} />
        <Text style={styles.unit}>{timeValue === 0 ? "blocked all day" : "min a day"}</Text>
      </View>

      <SetSlider min={0} max={120} ticks={[0, 30, 60, 90, 120]} value={timeValue} onValueChange={setTimeValue} />

      <PresetChips
        values={[30, 60, 90]}
        selected={timeValue}
        onSelect={(v) => {
          haptics.select();
          setTimeValue(v);
        }}
        format={(v) => `${v} min`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 28,
  },
  value: {
    fontFamily: fonts.serif,
    fontSize: 112,
    lineHeight: 132,
    letterSpacing: -3,
    color: cream.base,
  },
  unit: {
    fontFamily: fonts.serifItalic,
    fontSize: 24,
    color: cream.muted,
  },
});

export default SetTimeLimit;
