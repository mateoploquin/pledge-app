import React from "react";
import { StyleSheet, SafeAreaView, ImageBackground, ViewStyle } from "react-native";

interface HomeWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const HomeWrapper: React.FC<HomeWrapperProps> = ({ children, style }) => {
  return (
    <ImageBackground
      style={styles.imageContainer}
      source={require("../../../assets/images/home/background.png")}
    >
      <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    height: "100%",
  },
});

export default HomeWrapper;
