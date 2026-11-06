import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, fonts, radius, spacing } from "../../theme/tokens";

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
    style={[styles.box, { borderColor: tone === "error" ? color.error : color.warning }]}
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
    borderRadius: radius.control,
    backgroundColor: color.surface,
  },
  title: { fontFamily: fonts.uiSemibold, fontSize: 15, lineHeight: 21, color: color.text },
  text: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 21, color: color.textSecondary },
});

export default Callout;
