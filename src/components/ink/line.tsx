import React from "react";
import { StyleSheet, Text, TextStyle, StyleProp } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { fonts, motion, type } from "../../theme/tokens";

interface LineProps {
  /** `*word*` sets that word in italic. */
  text: string;
  /** "display" for the one big line on a screen, "heading" for a smaller one. */
  size?: "display" | "heading";
  style?: StyleProp<TextStyle>;
}

/** The serif line: one thought, one italic word. */
export const Line: React.FC<LineProps> = ({ text, size = "display", style }) => {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <Text style={[size === "display" ? type.display : type.heading, style]}>
      {parts.map((part, i) =>
        part.startsWith("*") ? (
          <Text key={i} style={styles.italic}>
            {part.slice(1, -1)}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

interface DissolveProps {
  /** Changing this remounts the children with a fade-through. */
  id: string;
  children: React.ReactNode;
  style?: any;
}

/**
 * Fade-through between two thoughts on the same screen. No sliding. The
 * outgoing view is gone before the incoming one shows, so two sets of
 * controls are never on screen together.
 */
export const Dissolve: React.FC<DissolveProps> = ({ id, children, style }) => (
  <Animated.View
    key={id}
    entering={FadeIn.duration(motion.dissolveMs).delay(motion.outMs)}
    exiting={FadeOut.duration(motion.outMs)}
    style={style}
  >
    {children}
  </Animated.View>
);

const styles = StyleSheet.create({
  italic: {
    fontFamily: fonts.serifItalic,
  },
});
