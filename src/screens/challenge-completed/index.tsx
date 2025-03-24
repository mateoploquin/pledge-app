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
    ReactNativeDeviceActivity.resetBlocks();

    await AsyncStorage.removeItem('pledgeSettings');
    await AsyncStorage.removeItem('challengeStartDate');
    
    navigation.navigate("Instructions");
  };

  useEffect(() => {
    if (result === "success") {
      ReactNativeDeviceActivity.stopMonitoring();
      ReactNativeDeviceActivity.resetBlocks();
    }
  }, [result]);

  return (
    <AppWrapper style={styles.wrapper}>
      <MainHeaderLight />

      <Text style={styles.headerText}>
        Challenge outcome
      </Text>

      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={
              result === "success"
                ? require("../../../assets/images/challenge-completed/golden-cup.png")
                : require("../../../assets/images/challenge-completed/failed-challenge.png")
            }
            style={styles.resultImage}
          />
          <PledgeFormIcon size={130} />
        </View>

        <Text style={styles.resultText}>
          {result === "success" ? (
            "Congratulations!\nYou Are a Certified Pledger!"
          ) : (
            <Text>
              You Gave It a Good Try!{"\n"}
              <Text style={styles.subText}>
                Sometimes change is hard, but every effort counts.
              </Text>
            </Text>
          )}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={() => handleRestart()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            New Challenge
          </Text>
        </Pressable>
      </View>
    </AppWrapper>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.orange
  },
  headerText: {
    fontFamily: "InstrumentSerif-Regular",
    color: colors.white,
    fontSize: 20,
    textAlign: "center",
    marginTop: 13,
  },
  card: {
    marginHorizontal: 32,
    backgroundColor: colors.white,
    paddingVertical: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SCREEN_HEIGHT * 0.10,
    borderRadius: 20,
    paddingTop: 50,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center"
  },
  resultImage: {
    width: 170,
    height: 180,
    marginBottom: -100,
    zIndex: 100,
    resizeMode: 'contain'
  },
  resultText: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 20,
    marginHorizontal: 50,
  },
  subText: {
    fontSize: 15
  },
  buttonContainer: {
    alignSelf: "center",
    position: "absolute",
    bottom: 40
  },
  button: {
    backgroundColor: colors.white,
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 17,
    borderRadius: 50,
    marginTop: 45,
  },
  buttonText: {
    color: colors.orange,
    fontWeight: "500"
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChallengeCompleted;
