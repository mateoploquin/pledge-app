import React from "react";
import { StyleSheet, View } from "react-native";
import { color } from "../../theme/tokens";

/** Thin bar under the number. The number leads; this never stands alone. */
const UsageBar: React.FC<{ used: number; limit: number }> = ({ used, limit }) => {
  const share = limit > 0 ? Math.min(used / limit, 1) : 1;
  return (
    <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.fill, { width: `${share * 100}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,222,196,0.16)", overflow: "hidden" },
  fill: { height: 4, borderRadius: 2, backgroundColor: color.text },
});

export default UsageBar;
