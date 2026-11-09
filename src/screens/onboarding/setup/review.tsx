import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SelectionInfo } from "../../../types/selectionInfo";
import { haptics } from "../../../utils/haptics";
import { CURRENCY_SYMBOL } from "../../../config";
import { color, fonts } from "../../../theme/tokens";
import { openLegal } from "./accept-terms";

interface ReviewProps {
  selection?: SelectionInfo;
  timeValue: number;
  durationDays: number;
  pledgeValue: number;
}

/** "3 apps, 1 category": Apple keeps the app names out of Pledge's own views. */
const appsLabel = (s?: SelectionInfo) => {
  if (!s) return "None chosen";
  const parts: string[] = [];
  const add = (n: number, one: string, many: string) => n > 0 && parts.push(`${n} ${n === 1 ? one : many}`);
  add(s.applicationCount, "app", "apps");
  add(s.categoryCount, "category", "categories");
  add(s.webDomainCount, "website", "websites");
  return parts.length ? parts.join(", ") : "None chosen";
};

const endDate = (days: number) =>
  new Date(Date.now() + days * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * Step: the whole pledge on one sober receipt, on every pledge (v2 Paper
 * "B7 Review", owner trimmed it on 8 Nov 2026): three rows, the amount and
 * one sentence of when money moves. The terms checkbox is `TermsCheck`, in
 * the footer over the button.
 */
const Review: React.FC<ReviewProps> = ({ selection, timeValue, durationDays, pledgeValue }) => {
  const amount = `${CURRENCY_SYMBOL}${pledgeValue}`;
  const rows: [string, string][] = [
    ["Apps", appsLabel(selection)],
    ["Daily limit", timeValue === 0 ? "Blocked all day" : `${timeValue} min, resets at midnight`],
    ["Length", `${durationDays} days, ends ${endDate(durationDays)}`],
  ];
  return (
    <View style={styles.container}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
      <View style={styles.total}>
        <Text style={styles.totalLabel}>Your pledge</Text>
        <Text style={styles.totalValue}>{amount}</Text>
      </View>
      <Text style={styles.rule}>
        Nothing is charged now. You pay {amount} only if you unlock early, delete Pledge or turn off Screen Time
        access.
      </Text>
    </View>
  );
};

/**
 * The Terms and Privacy checkbox, shown once per device until accepted. Paper
 * B7 puts it in the footer, 16 pt over the button, top-aligned with the text.
 */
export const TermsCheck: React.FC<{ termsAccepted: boolean; setTermsAccepted: (value: boolean) => void }> = ({
  termsAccepted,
  setTermsAccepted,
}) => (
  <Pressable
    onPress={() => {
      haptics.select();
      setTermsAccepted(!termsAccepted);
    }}
    style={styles.agree}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: termsAccepted }}
  >
    <View style={[styles.check, termsAccepted && styles.checkOn]}>
      {termsAccepted && (
        <Svg width={12} height={10} viewBox="0 0 16 12">
          <Path d="M1.5 6.5l4 4L14.5 1.5" fill="none" stroke={color.onAction} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </View>
    <Text style={styles.agreeText}>
      I agree to the{" "}
      <Text style={styles.link} onPress={() => openLegal("terms")}>
        Terms
      </Text>{" "}
      and{" "}
      <Text style={styles.link} onPress={() => openLegal("privacy")}>
        Privacy Policy
      </Text>
      .
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { alignSelf: "stretch" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: color.surfacePressed,
  },
  label: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 20, color: color.textTertiary },
  value: { flexShrink: 1, textAlign: "right", fontFamily: fonts.ui, fontSize: 15, lineHeight: 20, color: color.text },
  total: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingTop: 16 },
  totalLabel: { fontFamily: fonts.uiMedium, fontSize: 15, lineHeight: 20, color: color.text },
  totalValue: { fontFamily: fonts.uiSemibold, fontSize: 22, lineHeight: 28, color: color.text, fontVariant: ["tabular-nums"] },
  rule: { marginTop: 20, fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: color.textSecondary },
  agree: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: color.controlEdge,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: color.action, borderColor: color.action },
  agreeText: { flex: 1, fontFamily: fonts.ui, fontSize: 14, lineHeight: 20, color: color.textSecondary },
  link: { color: color.text, textDecorationLine: "underline" },
});

export default Review;
