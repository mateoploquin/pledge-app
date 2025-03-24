import React, { useState } from "react";
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
  const [startX, setStartX] = useState(0);

  const generateTickValues = (min: number, max: number): number[] => {
    const range = max - min;
    const step = range / 5;

    const roundToNiceNumber = (num: number): number => {
      const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
      const normalized = num / magnitude;

      if (normalized <= 2) return Math.round(normalized) * magnitude;
      if (normalized <= 5) return Math.round(normalized) * magnitude;
      return Math.round(normalized / 5) * 5 * magnitude;
    };

    const ticks: number[] = [];
    for (let i = 0; i <= 5; i++) {
      const rawValue = min + step * i;
      if (i === 0) {
        ticks.push(min);
      } else if (i === 5) {
        ticks.push(max);
      } else {
        ticks.push(roundToNiceNumber(rawValue));
      }
    }

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
      setValue(newValue);
      onValueChange(newValue);
    },
  });

  const getThumbPosition = () => {
    return ((value - min) / (max - min)) * SLIDER_WIDTH;
  };

  const renderTickMarks = () => {
    const ticks = generateTickValues(min, max);
    return ticks.map((tick, index) => (
      <View key={index} style={styles.tickContainer}>
        <View style={styles.tick} />
        <Text style={styles.tickLabel}>{tick}</Text>
      </View>
    ));
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: SLIDER_WIDTH,
    marginTop: 10,
  },
  tickContainer: {
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
