import React from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import colors from "../../theme/colors";

interface SecondaryButtonProps {
  onPress: () => void;
  text: string;
  style?: ViewStyle;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  onPress,
  text,
  style,
}) => {
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
    backgroundColor: colors.white,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.orange,
  },
  text: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SecondaryButton;
