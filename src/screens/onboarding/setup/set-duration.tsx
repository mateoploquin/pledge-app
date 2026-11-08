import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import PressableScale from "../../../components/buttons/pressable-scale";
import { haptics } from "../../../utils/haptics";
import { color, fonts, radius } from "../../../theme/tokens";

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
            <Text style={[styles.label, active && styles.labelActive]}>{d} days</Text>
            {active && (
              <Svg width={16} height={12} viewBox="0 0 16 12">
                <Path d="M1.5 6.5l4 4L14.5 1.5" fill="none" stroke={color.onAction} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    alignSelf: "stretch",
  },
  option: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.divider,
  },
  optionActive: {
    backgroundColor: color.action,
    borderColor: color.action,
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 16,
    color: color.textSecondary,
  },
  labelActive: {
    fontFamily: fonts.uiSemibold,
    color: color.onAction,
  },
});

export default SetDuration;
