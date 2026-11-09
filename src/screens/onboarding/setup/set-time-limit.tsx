import React from "react";
import { View, Text, StyleSheet } from "react-native";
import SetSlider from "../../../components/sliders/set-slider";
import AnimatedNumber from "../../../components/text/animated-number";
import PresetChips from "../../../components/buttons/preset-chips";
import { haptics } from "../../../utils/haptics";
import { color, fonts, type } from "../../../theme/tokens";

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
        {/* An en space is 8 pt at 16 pt: Paper B4's gap between number and unit. */}
        <Text style={styles.unit}>{timeValue === 0 ? "\u2002blocked all day" : "\u2002min a day"}</Text>
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
  // Paper B4: the number's row, 20 pt, then a 28 pt slider row whose track
  // sits 12 pt down; SetSlider adds 20 pt above its track, so 12 here.
  value: {
    ...type.value,
    marginBottom: 12,
  },
  unit: {
    fontFamily: fonts.ui,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    color: color.textSecondary,
  },
});

export default SetTimeLimit;
