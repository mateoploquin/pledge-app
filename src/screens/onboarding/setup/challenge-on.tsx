import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { EvilIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const ChallengeOn: React.FC = () => {
  const navigation = useNavigation();

  const handleSharePledge = () => {
    navigation.navigate("SharePledge");
  };

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

      <TouchableOpacity
        onPress={() => handleSharePledge()}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
          marginTop: 31,
        }}
      >
        <EvilIcons name="share-apple" size={30} color="#FF5900" />
      </TouchableOpacity>
    </View>
  );
};

export default ChallengeOn;
