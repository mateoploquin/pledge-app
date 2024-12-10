import React, { useCallback, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import MainButton from "../../components/buttons/main-button";
import colors from "../../theme/colors";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { auth } from '../../../firebaseConfig'; // Import Firebase auth
import SetPledge from "./setup/set-pledge";
import ChallengeOn from "./setup/challenge-on";
import SetTimeLimit from "./setup/set-time-limit";
import SetApps from "./setup/set-apps";
import InstructionCarousel from "../../components/carousels/instructions-carousel";
import AcceptTerms from "./setup/accept-terms";
import { sendPledgeData } from "../../services/sendPledgeData";

interface InstructionsProps {
  // define your props here
}

const Instructions: React.FC<InstructionsProps> = (props) => {
  const navigation = useNavigation();
  const [step, setStep] = useState<number>(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);

  const [pledgeValue, setPledgeValue] = useState<number>(10);
  const [timeValue, setTimeValue] = useState<number>(10);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      // Reset the step to 0 when the screen is focused
      setStep(0);
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigation.navigate("Login");
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  const handleNextStep = async () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (step == 4) {
          try {
            const idToken = await getIdToken(user, true);
            const pledgeData = {
              timeValue: timeValue,
              pledgeValue: pledgeValue,
              selectedApps: selectedApps, // Ensure this is correct
            };
            console.log('Pledge data to send:', pledgeData); // Log the pledge data
            await sendPledgeData(pledgeData, idToken);
            Alert.alert("Success", "Pledge data sent successfully!");
          } catch (error) {
            console.error("Error sending pledge data:", error);
            Alert.alert("Error", "Failed to send pledge data.");
          }
        }
        if (step == 5) {
          navigation.navigate("Home");
        } else {
          setStep(step + 1);
        }
      } else {
        navigation.navigate("Login");
      }
    });
  };

  return (
    <AppWrapper>
      {step !== 4 && <MainHeader />}

      {step === 0 ? (
        <InstructionCarousel />
      ) : step == 1 ? (
        <SetPledge
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          pledgeValue={pledgeValue}
          setPledgeValue={setPledgeValue}
        />
      ) : step == 2 ? (
        <SetTimeLimit
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          timeValue={timeValue}
          setTimeValue={setTimeValue}
        />
      ) : step == 3 ? (
        <SetApps
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          selectedApps={selectedApps}
          setSelectedApps={setSelectedApps}
        />
      ) : step == 4 ? (
        <AcceptTerms
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
        />
      ) : step == 5 ? (
        <ChallengeOn />
      ) : null}

      <View
        style={{
          position: "absolute",
          bottom: step == 5 || step == 0 ? 71 : 38,
          zIndex: 100,
          alignSelf: "center",
        }}
      >
        <MainButton
          onPress={handleNextStep}
          text={step == 5 ? "Track My Pledge" : "Continue"}
          style={{ width: 162 }}
        />
        {step !== 5 && step > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setStep(step - 1);
            }}
          >
            <Text
              style={{
                textDecorationLine: "underline",
                color: colors.orange,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </AppWrapper>
  );
};

export default Instructions;