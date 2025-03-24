import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SCREEN_WIDTH } from "../../utils/constants/dimensions";
import colors from "../../theme/colors";

const HomeHeader: React.FC = ({}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Pledge
      </Text>
      <Text style={styles.subtitle}>
        Live more, scroll less.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginTop: 16,
    // position: "absolute",
    width: SCREEN_WIDTH,
    alignItems: "center",
    alignSelf: "center",
  },
  title: {
    fontSize: 40,
    letterSpacing: -3,
    fontWeight: "800",
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 15,
    letterSpacing: 4,
  },
});

export default HomeHeader;
