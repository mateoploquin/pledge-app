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
import { useNavigation, NavigationProp } from "@react-navigation/native";

const Onboarding: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  const [isPledged, setIsPledged] = useState(false);
  const [iconSwitched, setIconSwitched] = useState(false);

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
      backgroundColor: withTiming(isPledged ? colors.onboardingBackground : "transparent", {
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

  const handleNavigateRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <Animated.View style={[styles.container, backgroundColorStyle]}>
      {!isPledged ? (
        <Animated.View style={[backgroundOpacityStyle, styles.root]}>
          <ImageBackground
            source={require("../../../assets/images/onboarding/onboarding-background-1.png")}
            style={styles.backgroundImage}
          >
            <Animated.View style={[textAnimatedStyle]}>
              <Animated.Text style={[font1AnimatedStyle, styles.whiteText]}>
                Pledge
              </Animated.Text>
              <Animated.Text style={[font2AnimatedStyle, styles.whiteText]}>
                Live more, scroll less.
              </Animated.Text>
            </Animated.View>
          </ImageBackground>
        </Animated.View>
      ) : (
        <View style={styles.pledgedContainer}>
          {iconSwitched ? (
            <OnboardingMenIconHarmsOpen
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT * 0.4}
              style={styles.openIconStyle}
            />
          ) : (
            <OnboardingMenIcon
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              style={styles.closedIconStyle}
            />
          )}

          <Animated.View style={[textAnimatedStyle]}>
            <Animated.Text style={[font1AnimatedStyle, styles.blackText]}>
              Pledge
            </Animated.Text>
            <Animated.Text style={[font2AnimatedStyle, styles.whiteText]}>
              Live more, scroll less.
            </Animated.Text>
            {iconSwitched ? (
              <>
                <Text style={styles.welcomeText}>Welcome!</Text>
                <MainButton
                  onPress={handleNavigateLogin}
                  text="Login"
                  style={styles.authButton}
                />
                <SecondaryButton
                  onPress={handleNavigateRegister}
                  text="Sign Up"
                  style={styles.signUpButton}
                />
              </>
            ) : (
              <>
                <View style={styles.pledgeTextContainer}>
                  <Text style={styles.pledgeMainText}>
                    Your time, your choice
                  </Text>
                  <Text style={styles.pledgeSubText}>
                    Start your challenge now.
                  </Text>
                  <View style={styles.pledgeButtonContainer}>
                    <MainButton onPress={handlePledge} text="Make A Pledge" />
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}

      <Animated.View style={[sliderAnimatedStyle, styles.sliderContainer]}>
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
  root: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  whiteText: {
    color: colors.white,
  },
  blackText: {
    color: colors.black,
  },
  pledgedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.onboardingBackground,
  },
  openIconStyle: {
    position: "absolute",
    bottom: 0,
  },
  closedIconStyle: {
    position: "absolute",
    bottom: 65,
  },
  welcomeText: {
    marginTop: 62,
    marginBottom: 40,
    fontSize: 22,
    fontWeight: "500",
  },
  authButton: {
    width: 230,
  },
  signUpButton: {
    width: 230,
    marginTop: 22,
  },
  pledgeTextContainer: {
    marginTop: 60,
  },
  pledgeMainText: {
    textAlign: "center",
    fontWeight: "500",
    fontSize: 24,
  },
  pledgeSubText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 24,
    color: colors.white,
  },
  pledgeButtonContainer: {
    marginTop: 20,
  },
  sliderContainer: {
    position: "absolute",
    bottom: 106,
    alignSelf: "center",
  },
});

export default Onboarding;
