import React from "react";
import { ActivityIndicator, StyleSheet, Text, StyleProp, ViewStyle } from "react-native";
import PressableScale from "../buttons/pressable-scale";
import { color, fonts, radius } from "../../theme/tokens";

interface PillButtonProps {
  text: string;
  onPress: () => void;
  /**
   * "primary" is the one solid ivory button on a screen; "ghost" an outline;
   * "quiet" plain text; "consequential" an outline for an action that costs
   * money or can't be undone.
   */
  tone?: "primary" | "ghost" | "quiet" | "consequential";
  disabled?: boolean;
  /** Shows a spinner in place of the text, keeping the button's size. */
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The app's button. Shrinks on press, spins in place while working. */
const PillButton: React.FC<PillButtonProps> = ({
  text,
  onPress,
  tone = "primary",
  disabled = false,
  busy = false,
  style,
}) => {
  const inactive = disabled || busy;
  return (
    <PressableScale
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      scaleTo={tone === "quiet" ? 0.98 : 0.97}
      haptic={tone === "primary" ? "press" : "tap"}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: inactive, busy }}
      style={[
        styles.base,
        tone === "primary" && styles.primary,
        tone === "ghost" && styles.ghost,
        tone === "consequential" && styles.consequential,
        tone === "quiet" && styles.quiet,
        disabled && tone === "primary" && styles.primaryDisabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={tone === "primary" ? color.onAction : color.text} />
      ) : (
        <Text style={[styles.text, tone === "primary" && styles.primaryText, disabled && styles.disabledText]}>
          {text}
        </Text>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.control,
    minHeight: 56,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: color.action,
  },
  primaryDisabled: {
    backgroundColor: color.surface,
  },
  ghost: {
    borderWidth: 1,
    borderColor: color.controlEdge,
  },
  consequential: {
    borderWidth: 1,
    borderColor: color.error,
  },
  quiet: {
    minHeight: 48,
  },
  text: {
    fontFamily: fonts.uiMedium,
    fontSize: 16,
    lineHeight: 20,
    color: color.text,
  },
  primaryText: {
    fontFamily: fonts.uiSemibold,
    color: color.onAction,
  },
  disabledText: {
    color: color.textTertiary,
  },
});

export default PillButton;
