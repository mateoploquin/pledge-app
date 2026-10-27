import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { EvilIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import colors from "../../../theme/colors";

const ChallengeOn: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleSharePledge = () => {
    navigation.navigate("SharePledge");
  };

  return (
    <View>
      <Image
        source={require("../../../../assets/images/onboarding/challenge-on.png")}
        style={styles.image}
      />

      <Text style={styles.title}>Challenge On!</Text>
      <Text style={styles.subtitle}>
        Take control of your time. Let the challenge begin!
      </Text>

      <TouchableOpacity onPress={() => handleSharePledge()} style={styles.shareButton}>
        <EvilIcons name="share-apple" size={30} color={colors.orange} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    marginTop: 59
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    textAlign: "center", 
    marginTop: 40
  },
  subtitle: {
    fontFamily: "InstrumentSerif-Regular",
    textAlign: "center",
    marginTop: 15,
    marginHorizontal: 30
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 31
  }
});

export default ChallengeOn;
