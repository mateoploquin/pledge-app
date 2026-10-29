import React from "react";
import { ActivityIndicator, StyleSheet, Text, StyleProp, ViewStyle } from "react-native";
import PressableScale from "../buttons/pressable-scale";
import { cream, ink, radius } from "../../theme/tokens";

interface PillButtonProps {
  text: string;
  onPress: () => void;
  /** "primary" is the one cream pill on a screen; "ghost" an outline; "quiet" plain text. */
  tone?: "primary" | "ghost" | "quiet";
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
      style={[
        styles.base,
        tone === "primary" && styles.primary,
        tone === "ghost" && styles.ghost,
        tone === "quiet" && styles.quiet,
        disabled && styles.disabled,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={tone === "primary" ? ink.base : cream.base} />
      ) : (
        <Text
          style={[
            styles.text,
            tone === "primary" && styles.primaryText,
            tone === "ghost" && styles.ghostText,
            tone === "quiet" && styles.quietText,
          ]}
        >
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
    borderRadius: radius.pill,
    minHeight: 54,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: cream.base,
  },
  ghost: {
    borderWidth: 1,
    borderColor: ink.line,
  },
  quiet: {
    minHeight: 40,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
  },
  primaryText: {
    color: ink.base,
  },
  ghostText: {
    color: cream.base,
    fontWeight: "500",
    fontSize: 16,
  },
  quietText: {
    color: cream.muted,
    fontWeight: "400",
    fontSize: 14,
  },
});

export default PillButton;
