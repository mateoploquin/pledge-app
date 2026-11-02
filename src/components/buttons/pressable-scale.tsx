import React, { useEffect } from "react";
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { haptics } from "../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** How far the control shrinks while held. */
  scaleTo?: number;
  /** Haptic to play on press-in; "none" to stay silent. */
  haptic?: "tap" | "press" | "none";
  children?: React.ReactNode;
}

/**
 * Pressable that gently shrinks and dims while held and springs back on
 * release, with a light haptic. Used by every button in the app so taps feel
 * consistent and soft.
 */
const PressableScale: React.FC<PressableScaleProps> = ({
  style,
  scaleTo = 0.96,
  haptic = "tap",
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}) => {
  const pressed = useSharedValue(0);
  // Keep any opacity the caller set (a disabled button's dim) under the press dim.
  // It goes through a shared value: a plain number captured by the animated
  // style was not reapplied when it changed, so a re-enabled button stayed dim.
  const { opacity: callerOpacity, ...restStyle } = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const baseOpacity = typeof callerOpacity === "number" ? callerOpacity : 1;
  const base = useSharedValue(baseOpacity);
  useEffect(() => {
    base.value = withTiming(baseOpacity, { duration: 160 });
  }, [base, baseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
    opacity: base.value * (1 - pressed.value * 0.12),
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      style={[restStyle, animatedStyle]}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        if (!disabled && haptic !== "none") haptics[haptic]();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, { damping: 14, stiffness: 220 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
};

export default PressableScale;
