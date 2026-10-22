import React, { useRef, useState } from "react";
import { haptics } from "../../utils/haptics";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";
const SLIDER_WIDTH = SCREEN_WIDTH * 0.8;

interface SetSliderProps {
  min: number;
  max: number;
  onValueChange: (value: number) => void;
}

const SetSlider: React.FC<SetSliderProps> = ({ min, max, onValueChange }) => {
  const [value, setValue] = useState(min);
  const valueRef = useRef(min);
  const [startX, setStartX] = useState(0);

  const generateTickValues = (min: number, max: number): number[] => {
    const range = max - min;
    // Pick a round step (1, 2, 2.5, 5 x 10^n) that yields roughly four intervals.
    const rough = range / 4;
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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event, gestureState) => {
      setStartX(gestureState.x0);
    },
    onPanResponderMove: (event, gestureState) => {
      let dx = gestureState.moveX - startX;
      let relativePosition = dx / SLIDER_WIDTH;
      let newValue = Math.round(relativePosition * (max - min) + min);
      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;
      if (newValue !== valueRef.current) {
        valueRef.current = newValue;
        haptics.select();
      }
      setValue(newValue);
      onValueChange(newValue);
    },
  });

  const getThumbPosition = () => {
    return ((value - min) / (max - min)) * SLIDER_WIDTH;
  };

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
        <View style={[styles.fill, { width: getThumbPosition() }]} />
        <View
          {...panResponder.panHandlers}
          style={[styles.thumb, { left: getThumbPosition() - 10 }]}
        />
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
