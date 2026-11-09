import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, fonts } from "../../theme/tokens";

export type PledgeStatus = "active" | "close" | "blocked" | "attention";

// Every mark is an 8 pt dot in the v2 Paper screens; the words carry the state.
const MARK: Record<PledgeStatus, { tint: string }> = {
  active: { tint: color.success },
  close: { tint: color.warning },
  blocked: { tint: color.text },
  attention: { tint: color.error },
};

/** A status in words, with a small mark. Colour is never the only signal. */
const StatusBadge: React.FC<{ status: PledgeStatus; text: string }> = ({ status, text }) => {
  const mark = MARK[status];
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { backgroundColor: mark.tint }]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: { width: 8, height: 8, borderRadius: 4 },
  text: { fontFamily: fonts.uiMedium, fontSize: 14, lineHeight: 18, color: color.text },
});

export default StatusBadge;
