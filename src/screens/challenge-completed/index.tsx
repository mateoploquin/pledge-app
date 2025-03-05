import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import colors from "../../theme/colors";
import MainHeaderLight from "../../components/headers/main-header-light";
import AppWrapper from "../../components/layout/app-wrapper";
import PledgeFormIcon from "../../../assets/images/icons/pledge-form";
import { SCREEN_HEIGHT } from "../../utils/constants/dimensions";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ReactNativeDeviceActivity from "react-native-device-activity";

interface ChallengeCompletedProps {
  navigation: any;
  route: {
    params?: {
      result?: string;
    }
  };
}

const ChallengeCompleted: React.FC<ChallengeCompletedProps> = ({
  navigation,
  route,
}) => {
  const result = route.params?.result || "success";

  const handleRestart = async () => {
    // Ensure all monitoring is stopped
    ReactNativeDeviceActivity.stopMonitoring();
    ReactNativeDeviceActivity.unblockApps();
    
    // Clear all challenge data
    await AsyncStorage.removeItem('pledgeSettings');
    await AsyncStorage.removeItem('challengeStartDate');
    
    // Navigate to instructions to start a new challenge
    navigation.navigate("Instructions");
  };

  // Only stop monitoring if this is a success result
  // For failure (surrender), the payment process has already handled this
  useEffect(() => {
    if (result === "success") {
      ReactNativeDeviceActivity.stopMonitoring();
      ReactNativeDeviceActivity.unblockApps();
    }
  }, [result]);

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
          marginTop: SCREEN_HEIGHT * 0.10,
          borderRadius: 20,
          paddingTop: 50,
        }}
      >
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Image
            source={
              result === "success"
                ? require("../../../assets/images/challenge-completed/golden-cup.png")
                : require("../../../assets/images/challenge-completed/failed-challenge.png")
            }
            style={{ 
              width: 170, 
              height: 180, 
              marginBottom: -100, 
              zIndex: 100,
              resizeMode: 'contain'
            }}
          />
          <PledgeFormIcon size={130} />
        </View>

        <Text
          style={{
            fontSize: 20,
            textAlign: "center",
            marginTop: 40,
            marginBottom: 20,
            marginHorizontal: 50,
          }}
        >
          {result === "success" ? (
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

      <View style={{ alignSelf: "center", position: "absolute", bottom: 40 }}>
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
