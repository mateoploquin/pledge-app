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

      <Text
        style={{
          fontSize: 30,
          fontWeight: "600",
          textAlign: "center",
          marginTop: 40,
        }}
      >
        Challenge On!
      </Text>
      <Text
        style={{
          fontFamily: "InstrumentSerif-Regular",
          textAlign: "center",
          marginTop: 15,
          marginHorizontal: 30,
        }}
      >
        Take control of your time. Let the challenge begin!
      </Text>
    </View>
  );
};

export default ChallengeOn;
