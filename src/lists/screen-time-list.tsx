import React from "react";
import { View, StyleSheet } from "react-native";
import { cream } from "../theme/tokens";

interface ScreenTimeListProps {
  usedMinutes?: number;
  limitMinutes?: number;
}

/** Thin bar showing today's usage against the daily limit. */
const ScreenTimeList: React.FC<ScreenTimeListProps> = ({
  usedMinutes = 0,
  limitMinutes = 0,
}) => {
  const ratio = limitMinutes > 0 ? Math.min(1, usedMinutes / limitMinutes) : 0;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    marginTop: 14,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(248, 244, 236, 0.14)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: cream.base,
  },
});

export default ScreenTimeList;
