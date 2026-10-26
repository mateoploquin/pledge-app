import React, { useEffect, useRef, useState } from "react";
import { haptics } from "../../utils/haptics";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";
const SLIDER_WIDTH = SCREEN_WIDTH * 0.8;

interface SetSliderProps {
  min: number;
  max: number;
  /** Controlled value; when it changes externally (e.g. a preset tap) the thumb follows. */
  value?: number;
  onValueChange: (value: number) => void;
}

const SetSlider: React.FC<SetSliderProps> = ({ min, max, value: controlled, onValueChange }) => {
  const [value, setValue] = useState(controlled ?? min);
  const valueRef = useRef(controlled ?? min);

  const toPosition = (v: number) => ((v - min) / (max - min)) * SLIDER_WIDTH;
  // Thumb/fill position on the UI thread. Dragging sets it directly; a preset
  // tap glides to the new spot as if the user had swiped there.
  const position = useSharedValue(toPosition(controlled ?? min));

  useEffect(() => {
    if (controlled !== undefined && controlled !== valueRef.current) {
      valueRef.current = controlled;
      setValue(controlled);
      position.value = withTiming(toPosition(controlled), {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [controlled]);

  const fillStyle = useAnimatedStyle(() => ({ width: position.value }));
  const thumbStyle = useAnimatedStyle(() => ({ left: position.value - 10 }));
  // Page x of the track's left edge, captured when a touch starts.
  const trackPageX = useRef(0);

  const generateTickValues = (min: number, max: number): number[] => {
    const range = max - min;
    // Pick a round step (1, 2, 2.5, 5 x 10^n) that yields roughly four intervals.
    const rough = range / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const candidates = [1, 2, 2.5, 5, 10].map((n) => n * magnitude);
    const step = candidates.find((c) => c >= rough) ?? candidates[candidates.length - 1];

    const ticks = [min];
    for (let v = Math.ceil(min / step) * step; v < max; v += step) {
      // Skip labels that would collide with the end labels.
      if (v - min > step * 0.4 && max - v > step * 0.4) ticks.push(Math.round(v));
    }
    ticks.push(max);
    return ticks;
  };

  const applyPageX = (pageX: number) => {
    const relative = (pageX - trackPageX.current) / SLIDER_WIDTH;
    let newValue = Math.round(relative * (max - min) + min);
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    if (newValue !== valueRef.current) {
      valueRef.current = newValue;
      haptics.select();
    }
    position.value = toPosition(newValue);
    setValue(newValue);
    onValueChange(newValue);
  };

  // The whole track is the touch target: tap anywhere to jump, or drag.
  // Value follows the finger's absolute position, so the thumb stays under it.
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const { pageX, locationX } = event.nativeEvent;
      trackPageX.current = pageX - locationX;
      applyPageX(pageX);
    },
    onPanResponderMove: (_event, gestureState) => {
      applyPageX(gestureState.moveX);
    },
  });

  const renderTickMarks = () => {
    const ticks = generateTickValues(min, max);
    return ticks.map((tick) => {
      const left = ((tick - min) / (max - min)) * SLIDER_WIDTH;
      return (
        <View key={tick} style={[styles.tickContainer, { left }]}>
          <View style={styles.tick} />
          <Text style={styles.tickLabel}>{tick}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
        <Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]} />
        <View {...panResponder.panHandlers} style={styles.hitArea} />
      </View>
      <View style={styles.ticksContainer}>{renderTickMarks()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: SLIDER_WIDTH,
    marginTop: 20,
  },
  track: {
    height: 8,
    backgroundColor: colors.darkGray,
    borderRadius: 4,
    position: "relative",
  },
  hitArea: {
    position: "absolute",
    left: 0,
    width: SLIDER_WIDTH,
    top: -20,
    height: 48,
  },
  fill: {
    height: 8,
    backgroundColor: colors.midOrange,
    borderRadius: 4,
    position: "absolute",
    left: 0,
    top: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    backgroundColor: colors.white,
    borderRadius: 10,
    position: "absolute",
    top: -6,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  ticksContainer: {
    width: SLIDER_WIDTH,
    height: 34,
    marginTop: 10,
  },
  tickContainer: {
    position: "absolute",
    top: 0,
    width: 40,
    marginLeft: -20,
    alignItems: "center",
  },
  tick: {
    width: 1,
    height: 10,
    backgroundColor: colors.darkestGray,
    marginBottom: 5,
  },
  tickLabel: {
    fontSize: 12,
    color: colors.darkestGray,
  },
});

export default SetSlider;
