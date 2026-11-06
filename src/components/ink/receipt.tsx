import React from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";
import { color, fonts, radius, spacing } from "../../theme/tokens";

export interface ReceiptRow {
  label: string;
  value: string;
  /** "amount" for the pledge itself, "strong" for a figure, "open" for an undecided term. */
  kind?: "amount" | "strong" | "open";
}

const VALUE_STYLE: Record<NonNullable<ReceiptRow["kind"]>, TextStyle> = {
  amount: {
    fontFamily: fonts.uiSemibold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.56,
    fontVariant: ["tabular-nums"],
  },
  strong: { fontFamily: fonts.uiSemibold, fontVariant: ["tabular-nums"] },
  open: { fontFamily: fonts.uiSemibold, color: color.receiptOpen },
};

/** The sober receipt: opaque, one aligned column, nothing decorative. */
const Receipt: React.FC<{ rows: ReceiptRow[] }> = ({ rows }) => (
  <View style={styles.card}>
    {rows.map((row, i) => (
      <View key={row.label} accessible style={[styles.row, i < rows.length - 1 && styles.rule]}>
        <Text style={styles.label}>{row.label}</Text>
        <Text style={[styles.value, row.kind && VALUE_STYLE[row.kind]]}>{row.value}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.action,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.sm },
  rule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.receiptRule },
  label: { width: 100, fontFamily: fonts.ui, fontSize: 15, lineHeight: 21, color: color.receiptLabel },
  value: { flex: 1, fontFamily: fonts.ui, fontSize: 15, lineHeight: 21, color: color.onAction },
});

export default Receipt;
