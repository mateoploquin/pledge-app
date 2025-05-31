import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";

interface HomeCardWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  onPress?: () => void;
}

const HomeCardWrapper: React.FC<HomeCardWrapperProps> = ({
  children,
  style,
  onPress,
  title,
}) => {
  return (
    <Pressable onPress={onPress} style={[styles.container, style]}>
      <Text style={styles.text}>{title}</Text>
      <View style={styles.children}>{children}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: colors.orange,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 20,
    padding: 2,
  },
  text: {
    marginTop: 6,
    marginHorizontal: 10,
    color: colors.white,
    fontWeight: "500",
    marginBottom: 7,
  },
  children: {
    backgroundColor: colors.white,
    borderRadius: 17,
  },
});

export default HomeCardWrapper;
