import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

interface ChallengeOnProps {
  // define your props here
}

const ChallengeOn: React.FC<ChallengeOnProps> = (props) => {
  return (
    <View>
      <Image
        source={require("../../../../assets/images/onboarding/challenge-on.png")}
        style={{ alignSelf: "center", marginTop: 59 }}
      />

      <Text>Challenge On!</Text>
      <Text>Take control of your time. Let the challenge begin!</Text>
    </View>
  );
};

export default ChallengeOn;