import React, { useState } from "react";
import { StyleSheet, View, Text, Dimensions, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

type SplashSliderProps = {
  isPledged: boolean;
  setIsPledged: (isPledged: boolean) => void;
};

const SplashSlider: React.FC<SplashSliderProps> = ({
  isPledged,
  setIsPledged,
}) => {
  const sliderValue = useSharedValue(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      const position = Math.max(0, Math.min(gestureState.dx, width * 0.6));
      sliderValue.value = withSpring(position);
    },
    onPanResponderRelease: (event, gestureState) => {
      if (gestureState.dx > width * 0.3) {
        sliderValue.value = withSpring(width * 0.65);
        setIsPledged(true);
      } else {
        sliderValue.value = withSpring(0);
        setIsPledged(false);
      }
    },
  });

  const animatedSliderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: sliderValue.value }],
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isPledged ? "#E76F33" : "#f0f0f0", {
        duration: 500,
      }),
    };
  });

  return (
    <Animated.View style={[styles.sliderBackground, animatedBackgroundStyle]}>
      <Text style={[styles.text, { color: isPledged ? "#fff" : "#aaa" }]}>
        {isPledged ? "Let’s Pledge" : "Slide to Unlock"}
      </Text>
      <Animated.View
        style={[styles.sliderButton, animatedSliderStyle]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.arrow}>{isPledged ? "✓" : "➔"}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sliderBackground: {
    width: width * 0.8,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    padding: 5,
    position: "relative",
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    position: "absolute",
    width: "100%",
    zIndex: 0,
  },
  sliderButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    zIndex: 1,
  },
  arrow: {
    fontSize: 24,
    color: "#E76F33",
  },
});

export default SplashSlider;
