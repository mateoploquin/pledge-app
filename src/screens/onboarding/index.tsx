import React from "react";
import { Text, StyleSheet, ImageBackground, View } from "react-native";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "../../utils/constants/dimensions";
import Onboarding from "./onboarding";

interface SplashScreenProps {
  // define your props here
}

const SplashScreen: React.FC<SplashScreenProps> = (props) => {
  return (
    <Onboarding />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SplashScreen;
