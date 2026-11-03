import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Dissolve, Line } from "../../components/ink/line";
import { cream } from "../../theme/tokens";

interface ChallengeCompletedProps {
  navigation: any;
  route: { params?: { result?: string } };
}

/** The end of a pledge. Reached only on success; paying out returns to Home. */
const ChallengeCompleted: React.FC<ChallengeCompletedProps> = ({ navigation, route }) => {
  const success = (route.params?.result ?? "success") === "success";
  const handleDone = () => navigation.reset({ index: 0, routes: [{ name: "Home" }] });

  return (
    <InkScreen footer={<PillButton text="Back to my pledges" onPress={handleDone} />}>
      <View style={styles.body}>
        <Dissolve id="done">
          <Line text={success ? "You kept\nyour *word.*" : "Next time,\n*then.*"} />
          <Text style={styles.text}>
            {success
              ? "The pledge is over and nothing was charged. The apps are yours again."
              : "The pledge was paid. The apps are open."}
          </Text>
        </Dissolve>
      </View>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 24,
  },
  text: {
    marginTop: 18,
    color: cream.muted,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
});

export default ChallengeCompleted;
