import React from "react";
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";

interface HomeCardWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  title?: string;
}

const HomeCardWrapper: React.FC<HomeCardWrapperProps> = ({
  children,
  style,
  onPress,
  title,
}) => {
  return (
    <Pressable onPress={onPress} style={[styles.container, style]}>
      <Text
        style={{
          marginTop: 6,
          marginHorizontal: 10,
          color: "white",
          fontWeight: "500",
          marginBottom: 7,
        }}
      >
        {title}
      </Text>
      <View style={{ backgroundColor: colors.white, borderRadius: 17 }}>
        {children}
      </View>
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
    // paddingVertical: 9,
    padding: 2,
  },
});

export default HomeCardWrapper;
