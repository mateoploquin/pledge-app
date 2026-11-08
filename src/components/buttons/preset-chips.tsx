import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { color, fonts, radius } from "../../theme/tokens";
import PressableScale from "./pressable-scale";

interface PresetChipsProps {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  /** Formats the label, e.g. (v) => `${v}m`. */
  format?: (value: number) => string;
}

/** Row of tappable quick picks shown under a slider. */
const PresetChips: React.FC<PresetChipsProps> = ({
  values,
  selected,
  onSelect,
  format = (v) => String(v),
}) => {
  return (
    <View style={styles.row}>
      {values.map((v) => {
        const active = v === selected;
        return (
          <PressableScale
            key={v}
            onPress={() => onSelect(v)}
            style={[styles.chip, active && styles.chipActive]}
            scaleTo={0.93}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{format(v)}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    alignSelf: "stretch",
  },
  chip: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: color.divider,
  },
  chipActive: {
    backgroundColor: color.action,
    borderColor: color.action,
  },
  label: {
    fontFamily: fonts.ui,
    fontSize: 15,
    color: color.textSecondary,
  },
  labelActive: {
    fontFamily: fonts.uiSemibold,
    color: color.onAction,
  },
});

export default PresetChips;
