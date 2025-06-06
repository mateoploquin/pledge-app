import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import colors from "../../theme/colors";

interface AppWrapperProps {
  children: React.ReactNode;
  style: object;
}

const AppWrapper: React.FC<AppWrapperProps> = ({ children, style }) => {
  return (
    <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
});

export default AppWrapper;
