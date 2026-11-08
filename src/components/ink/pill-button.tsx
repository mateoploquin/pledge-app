import React from "react";
import { ActivityIndicator, StyleSheet, Text, StyleProp, ViewStyle } from "react-native";
import PressableScale from "../buttons/pressable-scale";
import { color, fonts, radius } from "../../theme/tokens";
import GlassSurface from "./glass-surface";

interface PillButtonProps {
  text: string;
  onPress: () => void;
  /**
   * "primary" is the solid ivory button (making a pledge, Apple sign-in);
   * "glass" the clear glass button (Home, detail, Account); "ghost" an
   * outline; "quiet" plain text; "consequential" a red outline for an action
   * that costs money or can't be undone.
   */
  tone?: "primary" | "glass" | "ghost" | "quiet" | "consequential";
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
        tone === "glass" && styles.glass,
        disabled && tone === "primary" && styles.primaryDisabled,
        style,
      ]}
    >
      {tone === "glass" && <GlassSurface style={StyleSheet.absoluteFill} />}
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
    borderColor: "rgba(242,144,143,0.75)",
    borderRadius: radius.glass,
  },
  glass: {
    borderRadius: radius.glass,
    overflow: "hidden",
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
