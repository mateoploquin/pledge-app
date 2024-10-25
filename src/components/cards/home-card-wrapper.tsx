import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";

interface HomeCardWrapperProps {
  children: React.ReactNode;
  style: object;
}

const HomeCardWrapper: React.FC<HomeCardWrapperProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 19,
  },
});

export default HomeCardWrapper;
