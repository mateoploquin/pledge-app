import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import colors from "../../theme/colors";
import PressableScale from "./pressable-scale";

interface MainButtonProps {
  onPress: () => void;
  text: string;
  style?: ViewStyle;
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
      <PressableScale
        haptic="press"
        disabled={disabled}
        onPress={!disabled ? onPress : undefined}
        style={[styles.container, disabled && styles.disabled]}
      >
        <Text style={[styles.text, disabled && { opacity: 0.6 }]}>{text}</Text>
      </PressableScale>
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
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default MainButton;
