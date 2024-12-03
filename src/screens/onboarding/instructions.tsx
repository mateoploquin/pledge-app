import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import MainButton from "../../components/buttons/main-button";
import colors from "../../theme/colors";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import SetPledge from "./setup/set-pledge";
import ChallengeOn from "./setup/challenge-on";
import SetTimeLimit from "./setup/set-time-limit";
import SetApps from "./setup/set-apps";
import InstructionCarousel from "../../components/carousels/instructions-carousel";
import AcceptTerms from "./setup/accept-terms";

interface InstructionsProps {
  // define your props here
}

const Instructions: React.FC<InstructionsProps> = (props) => {
  const navigation = useNavigation();
  const [step, setStep] = useState<Number>(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState<Boolean>(false);

  const isReturningFromShare = useRef(false);

  const [pledgeValue, setPledgeValue] = useState<Number>(10);
  const [timeValue, setTimeValue] = useState<Number>(10);
  const [selectedApps, setSelectedApps] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState<Boolean>(false);

  useFocusEffect(
    useCallback(() => {
      // Only reset step if we're not returning from SharePledge
      if (!isReturningFromShare.current) {
        setStep(0);
      }
      // Reset the flag
      isReturningFromShare.current = false;
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Set the flag when navigating to SharePledge
      if ((navigation as any).getState().routes.slice(-1)[0]?.name === 'SharePledge') {
        isReturningFromShare.current = true;
      }
    });

    return unsubscribe;
  }, [navigation]);

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
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
        />
      ) : step == 5 ? (
        <ChallengeOn />
      ) : null}

      {/* <View
        style={{
          position: "absolute",
          bottom: step == 5 || step == 0 ? 71 : 38,
          zIndex: 100,
          alignSelf: "center",
        }}
      >
        <MainButton
          onPress={() => {
            if (step == 5) {
              navigation.navigate("Home");
            } else {
              setStep(step + 1);
            }
          }}
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
      </View> */}

      <View
        style={{
          position: "absolute",
          bottom: step == 5 || step == 0 ? 71 : 38,
          zIndex: 100,
          alignSelf: "center",
        }}
      >
        <MainButton
          onPress={() => {
            if (step == 5) {
              navigation.navigate("Home");
            } else {
              setStep(step + 1);
            }
          }}
          text={step == 5 ? "Track My Pledge" : "Continue"}
          style={{ width: 162 }}
          disabled={step === 4 && !termsAccepted} // Disable only on AcceptTerms step if unchecked
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
