import React from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../utils/constants/dimensions";
import OnboardingMenIconHarmsOpen from "../../../assets/icons/onboarding-men-icon-harms-open";
import MainButton from "../../components/buttons/main-button";
import SecondaryButton from "../../components/buttons/secondary-button";
import colors from "../../theme/colors";

/** First screen for signed-out users: brand, one line, and the two ways in. */
const Onboarding: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(600)} style={styles.illustration}>
        <OnboardingMenIconHarmsOpen width={SCREEN_WIDTH} height={SCREEN_HEIGHT * 0.4} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(120)} style={styles.content}>
        <Text style={styles.title}>Pledge</Text>
        <Text style={styles.tagline}>Live more, scroll less.</Text>

        <Text style={styles.welcome}>Welcome!</Text>
        <MainButton
          onPress={() => navigation.navigate("Login")}
          text="Login"
          style={styles.authButton}
        />
        <SecondaryButton
          onPress={() => navigation.navigate("Register")}
          text="Sign Up"
          style={styles.signUpButton}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  illustration: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  content: {
    position: "absolute",
    top: 75,
    width: SCREEN_WIDTH,
    alignItems: "center",
  },
  title: {
    fontSize: 35,
    fontWeight: "700",
    color: colors.black,
  },
  tagline: {
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: "400",
    marginTop: 4,
    color: colors.orange,
  },
  welcome: {
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
});

export default Onboarding;
