import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, fonts, spacing } from "../../theme/tokens";

interface CalloutProps {
  title: string;
  text: string;
  tone?: "warning" | "error";
}

/** A state the user must know about, on a solid surface, in words. */
const Callout: React.FC<CalloutProps> = ({ title, text, tone = "warning" }) => (
  <View
    accessible
    accessibilityRole="alert"
    style={[styles.box, tone === "error" ? styles.error : styles.warning]}
  >
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  box: {
    gap: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 20,
  },
  // Tinted washes from the v2 Paper screens, so the ground still shows.
  error: { borderColor: "rgba(242,144,143,0.55)", backgroundColor: "rgba(242,144,143,0.08)" },
  warning: { borderColor: "rgba(232,182,92,0.6)", backgroundColor: "rgba(232,182,92,0.08)" },
  title: { fontFamily: fonts.uiSemibold, fontSize: 15, lineHeight: 21, color: color.text },
  text: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21, color: color.textSecondary },
});

export default Callout;
