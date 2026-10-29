import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { cream } from "../../../theme/tokens";

/**
 * Step: the deal, in six lines, before the first question of the first
 * pledge. Testers went through the steps without knowing what they were
 * signing up for; this is the one place the whole thing is said at once.
 */
const TheDeal: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>
      Pick the apps that take your time.{"\n"}
      Set how much is enough a day.{"\n"}
      Put money on it.
    </Text>
    <Text style={styles.text}>
      Go over, and they lock until midnight.{"\n"}
      Unlock early, and you pay.{"\n"}
      Keep your word, and it costs nothing.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  text: {
    color: cream.base,
    fontSize: 19,
    lineHeight: 29,
  },
});

export default TheDeal;
