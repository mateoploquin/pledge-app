import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, fonts } from "../../theme/tokens";

export type PledgeStatus = "active" | "close" | "blocked" | "attention";

const MARK: Record<PledgeStatus, { tint: string; square?: boolean }> = {
  active: { tint: color.success },
  close: { tint: color.warning, square: true },
  blocked: { tint: color.text, square: true },
  attention: { tint: color.error, square: true },
};

/** A status in words, with a small mark. Colour is never the only signal. */
const StatusBadge: React.FC<{ status: PledgeStatus; text: string }> = ({ status, text }) => {
  const mark = MARK[status];
  return (
    <View style={styles.row}>
      <View style={[styles.mark, { backgroundColor: mark.tint }, !mark.square && styles.round]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: { width: 8, height: 8 },
  round: { borderRadius: 4 },
  text: { fontFamily: fonts.uiMedium, fontSize: 14, lineHeight: 18, color: color.text },
});

export default StatusBadge;
