import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, fonts, spacing } from "../../theme/tokens";

interface CalloutProps {
  title: string;
  text: string;
  tone?: "warning" | "error";
  /** Paper draws two sizes: Home's (C4) and the smaller one on Account (E4) and the card step (B8). */
  compact?: boolean;
}

/** A state the user must know about, on a solid surface, in words. */
const Callout: React.FC<CalloutProps> = ({ title, text, tone = "warning", compact = false }) => (
  <View
    accessible
    accessibilityRole="alert"
    style={[styles.box, compact && styles.boxCompact, tone === "error" ? styles.error : styles.warning]}
  >
    <Text style={styles.title}>{title}</Text>
    <Text style={[styles.text, compact && styles.textCompact]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  box: {
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 24,
  },
  boxCompact: { gap: 6, paddingVertical: spacing.md, paddingHorizontal: 18, borderRadius: 20 },
  // Tinted washes from the v2 Paper screens, so the ground still shows.
  error: { borderColor: "rgba(242,144,143,0.55)", backgroundColor: "rgba(242,144,143,0.08)" },
  warning: { borderColor: "rgba(232,182,92,0.6)", backgroundColor: "rgba(232,182,92,0.08)" },
  title: { fontFamily: fonts.uiSemibold, fontSize: 15, lineHeight: 18, color: color.text },
  text: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: "#E6D8CC" },
  textCompact: { fontSize: 14, lineHeight: 20 },
});

export default Callout;
