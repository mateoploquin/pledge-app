import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PressableScale from "../../../components/buttons/pressable-scale";
import { haptics } from "../../../utils/haptics";
import { cream, fonts, ink, radius } from "../../../theme/tokens";

export const DURATION_OPTIONS = [7, 15, 30];

interface SetDurationProps {
  durationDays: number;
  setDurationDays: (days: number) => void;
}

/** Step: how many days the pledge runs. */
const SetDuration: React.FC<SetDurationProps> = ({ durationDays, setDurationDays }) => {
  return (
    <View style={styles.container}>
      {DURATION_OPTIONS.map((d) => {
        const active = d === durationDays;
        return (
          <PressableScale
            key={d}
            onPress={() => {
              haptics.select();
              setDurationDays(d);
            }}
            style={[styles.option, active && styles.optionActive]}
            scaleTo={0.97}
          >
            <Text style={[styles.number, active && styles.textActive]}>{d}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>days</Text>
          </PressableScale>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: ink.line,
  },
  optionActive: {
    backgroundColor: cream.base,
    borderColor: cream.base,
  },
  number: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 54,
    color: cream.base,
  },
  label: {
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    color: cream.muted,
  },
  textActive: {
    color: ink.base,
  },
  labelActive: {
    color: "rgba(23, 19, 15, 0.65)",
  },
});

export default SetDuration;
