import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import colors from "../../theme/colors";

interface MainButtonProps {
  onPress: () => void;
  text: string;
  style?: any;
  disabled?: boolean;
}

const MainButton: React.FC<MainButtonProps> = ({
  onPress,
  text,
  style,
  disabled = false,
}) => {
  return (
    <View style={[{ alignSelf: "center" }, style]}>
      <Pressable
        onPress={!disabled ? onPress : undefined}
        style={[
          styles.container,
          disabled && { backgroundColor: colors.orange, opacity: 0.6 },
        ]}
      >
        <Text style={[styles.text, disabled && { opacity: 0.6 }]}>{text}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.orange,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default MainButton;
