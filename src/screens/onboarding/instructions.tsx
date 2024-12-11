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
import SetApps, { SelectionInfo } from "./setup/set-apps";
import InstructionCarousel from "../../components/carousels/instructions-carousel";
import AcceptTerms from "./setup/accept-terms";
import { AuthorizationStatus } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import { getAuthorizationStatus } from 'react-native-device-activity';
import SetPayment from "./setup/set-up-payment"; // Import the new component


interface InstructionsProps {
  // define your props here
}

const Instructions: React.FC<InstructionsProps> = (props) => {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const isReturningFromShare = useRef(false);
  const [pledgeValue, setPledgeValue] = useState(10);
  const [timeValue, setTimeValue] = useState(10);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatus>(getAuthorizationStatus);
  const [selectionEvent, setSelectionEvent] = useState<SelectionInfo>();

  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);

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
    <AppWrapper style={{}}>
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
          authorizationStatus={authorizationStatus}
          setAuthorizationStatus={setAuthorizationStatus}
          selectionEvent={selectionEvent}
          setSelectionEvent={setSelectionEvent}
        />
      ) : step == 4 ? (
        <AcceptTerms
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
        />
      ) : step == 5 ? (
        <SetPayment
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          paymentSetupComplete={paymentSetupComplete}
          setPaymentSetupComplete={setPaymentSetupComplete}
          pledgeValue={pledgeValue}
        />
      ) : step == 6 ? ( // Add the new step condition
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
            if (step == 6) {
              navigation.navigate("Home");
            } else {
              setStep(step + 1);
            }
          }}
          text={step == 6 ? "Track My Pledge" : "Continue"}
          style={{ width: 162 }}
        />
        {step !== 6 && step > 0 ? (
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
              navigation.navigate("Home", {selectionEvent, pledgeValue, timeValue});
            } else if (step === 3 && authorizationStatus !== AuthorizationStatus.approved) {
              return;
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
