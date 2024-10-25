import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import colors from "../../theme/colors";

interface MainButtonProps {
  onPress: () => void;
  text: string;
  style?: any;
}

const MainButton: React.FC<MainButtonProps> = ({ onPress, text, style }) => {
  return (
    <View style={[{ alignSelf: "center" }, style]}>
      <Pressable onPress={onPress} style={styles.container}>
        <Text style={styles.text}>{text}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // alignSelf: "flex-start",
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
