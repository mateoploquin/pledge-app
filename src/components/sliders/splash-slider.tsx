import React from "react";
import { StyleSheet, Text, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import colors from "../../theme/colors";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";

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
      const position = Math.max(
        0,
        Math.min(gestureState.dx, SCREEN_WIDTH * 0.6)
      );
      sliderValue.value = withSpring(position);
    },
    onPanResponderRelease: (event, gestureState) => {
      if (gestureState.dx > SCREEN_WIDTH * 0.3) {
        sliderValue.value = withSpring(SCREEN_WIDTH * 0.65);
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
      backgroundColor: withTiming(
        isPledged ? colors.midOrange : colors.darkWhite,
        {
          duration: 500,
        }
      ),
    };
  });

  return (
    <Animated.View style={[styles.sliderBackground, animatedBackgroundStyle]}>
      <Text
        style={[
          styles.text,
          { color: isPledged ? colors.white : colors.gray1 },
        ]}
      >
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
    width: SCREEN_WIDTH * 0.8,
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
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    zIndex: 1,
  },
  arrow: {
    fontSize: 24,
    color: colors.midOrange,
  },
});

export default SplashSlider;
