import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MainCheckboxProps {
  size: number;
  isChecked: boolean;
  setIsChecked: (value: boolean) => void;
}

const MainCheckbox: React.FC<MainCheckboxProps> = ({
  size,
  isChecked,
  setIsChecked,
}) => {
  return (
    <View style={styles.container}>
      <Text>Hello, React Native!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MainCheckbox;
