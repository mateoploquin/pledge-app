import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";

const MainHeaderLight: React.FC = ({}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pledge</Text>
      <Text style={styles.subtitle}>Live more, scroll less.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    width: SCREEN_WIDTH,
    alignItems: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 40,
    letterSpacing: -3,
    fontWeight: "800",
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: "400",
    marginTop: 4,
    color: colors.white,
  },
});

export default MainHeaderLight;
