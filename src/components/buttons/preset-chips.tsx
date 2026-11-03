import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { cream, ink } from "../../theme/tokens";
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
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 26,
    paddingHorizontal: 20,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ink.line,
  },
  chipActive: {
    backgroundColor: cream.base,
    borderColor: cream.base,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: cream.base,
  },
  labelActive: {
    color: ink.base,
  },
});

export default PresetChips;
