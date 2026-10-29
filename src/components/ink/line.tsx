import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet, Text, TextStyle, StyleProp } from "react-native";
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
  /** Changing this fades the old children out and the new ones in. */
  id: string;
  children: React.ReactNode;
  style?: any;
}

// With Reduce Motion on, a change of thought is a cut, not a fade.
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((on) => {
    reduceMotion = on;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener("reduceMotionChanged", (on) => {
  reduceMotion = on;
});

/**
 * Fade-through between two thoughts on the same screen. No sliding. The
 * outgoing view is gone before the incoming one shows, so two sets of
 * controls are never on screen together.
 *
 * The content is visible from the first frame and only a change of `id`
 * animates. It must not wait for an animation to reveal it: a view that
 * starts at opacity 0 stays blank if that animation never runs, which is
 * what TestFlight testers saw on the first pledge step (build 20). The
 * fade is React Native's own `Animated` on the native driver, the same
 * machinery as the screen transitions.
 */
export const Dissolve: React.FC<DissolveProps> = ({ id, children, style }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(id);
  const latestId = useRef(id);
  latestId.current = id;
  // The outgoing content stays on screen, frozen, while it fades out.
  const content = useRef(children);
  if (shown === id) content.current = children;

  useEffect(() => {
    if (id === shown) return;
    let stale = false;
    const fade = (toValue: number, duration: number) =>
      Animated.timing(opacity, { toValue, duration: reduceMotion ? 0 : duration, useNativeDriver: true });
    fade(0, motion.outMs).start(() => {
      if (stale) return;
      setShown(latestId.current);
      fade(1, motion.dissolveMs).start();
    });
    return () => {
      stale = true;
    };
  }, [id, shown, opacity]);

  return (
    <Animated.View style={[style, { opacity }]}>
      <React.Fragment key={shown}>{content.current}</React.Fragment>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  italic: {
    fontFamily: fonts.serifItalic,
  },
});
