import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import colors from "../../theme/colors";
import MainHeaderLight from "../../components/headers/main-header-light";
import AppWrapper from "../../components/layout/app-wrapper";
import PledgeFormIcon from "../../../assets/images/icons/pledge-form";
import { SCREEN_HEIGHT } from "../../utils/constants/dimensions";

interface ChallengeCompletedProps {
  navigation: any;
  result: string;
}

const ChallengeCompleted: React.FC<ChallengeCompletedProps> = ({
  navigation,
  result,
}) => {
  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRestart = () => {
    navigation.navigate("Instructions");
  };

  return (
    <AppWrapper style={{ backgroundColor: colors.orange }}>
      <MainHeaderLight />

      <Text
        style={{
          fontFamily: "InstrumentSerif-Regular",
          color: "white",
          fontSize: 20,
          textAlign: "center",
          marginTop: 13,
        }}
      >
        Challenge outcome
      </Text>

      <View
        style={{
          marginHorizontal: 32,
          backgroundColor: "white",
          paddingVertical: 30,
          justifyContent: "center",
          alignItems: "center",
          marginTop: SCREEN_HEIGHT * 0.15,
          borderRadius: 20,
        }}
      >
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Image
            source={
              result == "success"
                ? require("../../../assets/images/challenge-completed/golden-cup.png")
                : require("../../../assets/images/challenge-completed/failed-challenge.png")
            }
            style={{ width: 170, height: 180, marginBottom: -130, zIndex: 100 }}
          />
          <PledgeFormIcon size={130} />
        </View>

        <Text
          style={{
            fontSize: 20,
            textAlign: "center",
            marginTop: 10,
            marginBottom: 20,
            marginHorizontal: 50,
          }}
        >
          {result == "success" ? (
            "Congratulations!\nYou Are a Certified Pledger!"
          ) : (
            <Text>
              You Gave It a Good Try!{"\n"}
              <Text style={{ fontSize: 15 }}>
                Sometimes change is hard, but every effort counts.
              </Text>
            </Text>
          )}
        </Text>
      </View>

      <View style={{ alignSelf: "center", position: "absolute", bottom: 60 }}>
        <Pressable
          onPress={() => handleRestart()}
          style={{
            backgroundColor: "white",
            alignSelf: "flex-start",
            paddingVertical: 12,
            paddingHorizontal: 17,
            borderRadius: 50,
            marginTop: 45,
          }}
        >
          <Text style={{ color: colors.orange, fontWeight: "500" }}>
            New Challenge
          </Text>
        </Pressable>

        <Text
          onPress={() => handleGoBack()}
          style={{
            textDecorationLine: "underline",
            fontSize: 16,
            color: colors.white,
            textAlign: "center",
            fontWeight: "500",
            marginTop: 7,
          }}
        >
          Maybe later
        </Text>
      </View>
    </AppWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChallengeCompleted;
