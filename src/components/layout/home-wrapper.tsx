import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ImageBackground,
} from "react-native";
import colors from "../../theme/colors";

interface HomeWrapperProps {
  children: React.ReactNode;
  style: object;
}

const HomeWrapper: React.FC<HomeWrapperProps> = ({ children, style }) => {
  return (
    <ImageBackground
      style={{ position: "absolute", top: 0, height: "100%" }}
      source={require("../../../assets/images/home/background.png")}
    >
      <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: colors.onboardingBackground,
  },
});

export default HomeWrapper;
