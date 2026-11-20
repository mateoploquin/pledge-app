import React, { createContext, useContext } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

/**
 * Home's list runs on behind the New pledge button and dissolves there,
 * instead of being cut off by a hard edge above it (TOM-5, owner 20 Nov
 * 2026: "right now we just cut, and the button appears").
 *
 * No mask: React Native can't fade a native view (the Liquid Glass bubbles,
 * the report) along a gradient without a masked-view package, and a scrim
 * would dim the low sun behind the button. So each card fades as a whole,
 * by where it is: whole while it sits above the button, then sinking away
 * (fading, shrinking a touch) as it slides down behind it, gone by the time
 * its top reaches the button. The next card peeks out faintly, saying there
 * is more below; scroll and it comes up whole.
 */

/** Points above the button's top edge where a card starts to fade. */
export const FADE_LEAD = 16;
/** Of a card's height, how far past the line its bottom goes before it's gone. */
const FADE_SPAN = 0.9;
/** How much a card shrinks on its way out. */
const SINK_SCALE = 0.04;

export interface FootFadeFrame {
  /** The list's scroll offset. */
  scrollY: SharedValue<number>;
  /** Where fading starts, in the list's visible frame (0 = its top). 0 until measured. */
  line: SharedValue<number>;
  /** The y of the faded rows' container within the scroll content. */
  offset: SharedValue<number>;
}

const Frame = createContext<FootFadeFrame | null>(null);
export const FootFadeProvider = Frame.Provider;

/** The shared values a screen needs to run a FootFade list. */
export const useFootFadeFrame = (): FootFadeFrame => ({
  scrollY: useSharedValue(0),
  line: useSharedValue(0),
  offset: useSharedValue(0),
});

/** One row of the list, fading as it goes behind the footer. */
export const FootFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useContext(Frame);
  const y = useSharedValue(0);
  const h = useSharedValue(0);
  const onLayout = (e: LayoutChangeEvent) => {
    y.value = e.nativeEvent.layout.y;
    h.value = e.nativeEvent.layout.height;
  };
  const style = useAnimatedStyle(() => {
    if (!frame || frame.line.value <= 0 || h.value <= 0) return { opacity: 1, transform: [{ scale: 1 }] };
    const bottom = frame.offset.value + y.value + h.value - frame.scrollY.value;
    const p = interpolate(bottom, [frame.line.value, frame.line.value + h.value * FADE_SPAN], [0, 1], Extrapolation.CLAMP);
    return { opacity: 1 - p, transform: [{ scale: 1 - SINK_SCALE * p }] };
  });
  return (
    <Animated.View onLayout={onLayout} style={style}>
      {children}
    </Animated.View>
  );
};
