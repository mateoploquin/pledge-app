import React, { useState } from "react";
import { StyleSheet, ImageBackground, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../utils/constants/dimensions";
import SplashSlider from "../../components/sliders/splash-slider";
import OnboardingMenIcon from "../../../assets/icons/onboarding-men-icon";
import MainButton from "../../components/buttons/main-button";
import OnboardingMenIconHarmsOpen from "../../../assets/icons/onboarding-men-icon-harms-open";
import SecondaryButton from "../../components/buttons/secondary-button";
import colors from "../../theme/colors";
import LoginScreen from "./login";
import { useNavigation } from "@react-navigation/native";

const Onboarding: React.FC = () => {
  const navigation = useNavigation();

  const [isPledged, setIsPledged] = useState(false);
  const [iconSwitched, setIconSwitched] = useState(false);

  const topValue = useSharedValue(SCREEN_HEIGHT / 2 - 100);
  const sliderOpacity = useSharedValue(1);
  const fontSize1 = useSharedValue(100);
  const fontSize2 = useSharedValue(19.2);
  const letterSpacing2 = useSharedValue(0.29);

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      top: withTiming(isPledged ? 75 : SCREEN_HEIGHT / 2 - 100, {
        duration: 500,
      }),
      position: "absolute",
      width: SCREEN_WIDTH,
      alignItems: "center",
    };
  });

  const font1AnimatedStyle = useAnimatedStyle(() => {
    return {
      fontSize: withTiming(isPledged ? 35 : 100, { duration: 500 }),
      fontWeight: isPledged ? "700" : "800",
    };
  });

  const font2AnimatedStyle = useAnimatedStyle(() => {
    return {
      fontSize: withTiming(isPledged ? 12 : 19.2, { duration: 500 }),
      letterSpacing: withTiming(isPledged ? 4 : 7, { duration: 500 }),
      fontWeight: "400",
      marginTop: withTiming(isPledged ? 4 : 5, { duration: 500 }),
      color: withTiming(isPledged ? colors.orange : colors.black, {
        duration: 500,
      }),
    };
  });

  const sliderAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isPledged ? 0 : 1, { duration: 500 }),
    };
  });

  const backgroundOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isPledged ? 0 : 1, { duration: 500 }),
    };
  });

  const backgroundColorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isPledged ? "#FFF6F1" : "transparent", {
        duration: 500,
      }),
    };
  });

  const handlePledge = () => {
    setIsPledged(true);
    setTimeout(() => setIconSwitched(true), 500);
  };

  const handleNavigateLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <Animated.View style={[styles.container, backgroundColorStyle]}>
      {!isPledged ? (
        <Animated.View style={[backgroundOpacityStyle, { flex: 1 }]}>
          <ImageBackground
            source={require("../../../assets/images/onboarding/onboarding-background-1.png")}
            style={{
              flex: 1,
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.View style={[textAnimatedStyle]}>
              <Animated.Text style={[font1AnimatedStyle, { color: "white" }]}>
                Pledge
              </Animated.Text>
              <Animated.Text style={[font2AnimatedStyle, { color: "white" }]}>
                the bet to break free
              </Animated.Text>
            </Animated.View>
          </ImageBackground>
        </Animated.View>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FFF6F1",
          }}
        >
          {iconSwitched ? (
            <OnboardingMenIconHarmsOpen
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT * 0.4}
              style={{ position: "absolute", bottom: 0 }}
            />
          ) : (
            <OnboardingMenIcon
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              style={{ position: "absolute", bottom: 65 }}
            />
          )}

          <Animated.View style={[textAnimatedStyle]}>
            <Animated.Text style={[font1AnimatedStyle, { color: "black" }]}>
              Pledge
            </Animated.Text>
            <Animated.Text style={[font2AnimatedStyle, { color: "black" }]}>
              the bet to break free
            </Animated.Text>
            {iconSwitched ? (
              <>
                <Text
                  style={{
                    marginTop: 62,
                    marginBottom: 40,
                    fontSize: 22,
                    fontWeight: "500",
                  }}
                >
                  Welcome!
                </Text>
                <MainButton
                  onPress={handleNavigateLogin}
                  text="Login"
                  style={{ width: 230 }}
                />

                <SecondaryButton
                  text={"Sign Up"}
                  style={{ width: 230, marginTop: 22 }}
                />
              </>
            ) : (
              <>
                <View style={{ marginTop: 60 }}>
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "500",
                      fontSize: 24,
                    }}
                  >
                    Your time, your choice
                  </Text>
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: 24,
                      color: colors.white,
                    }}
                  >
                    Start your challenge now.
                  </Text>

                  <View style={{ marginTop: 20 }}>
                    <MainButton onPress={handlePledge} text="Make A Pledge" />
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}

      <Animated.View
        style={[
          sliderAnimatedStyle,
          { position: "absolute", bottom: 106, alignSelf: "center" },
        ]}
      >
        <SplashSlider isPledged={isPledged} setIsPledged={setIsPledged} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default Onboarding;
