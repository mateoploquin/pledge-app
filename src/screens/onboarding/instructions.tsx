import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import MainButton from "../../components/buttons/main-button";
import colors from "../../theme/colors";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import SetPledge from "./setup/set-pledge";
import ChallengeOn from "./setup/challenge-on";
import SetFocusTime from "./setup/set-focus-time";
import SetApps from "./setup/set-apps";
import InstructionCarousel from "../../components/carousels/instructions-carousel";
import AcceptTerms from "./setup/accept-terms";
import { AuthorizationStatus } from 'react-native-device-activity/build/ReactNativeDeviceActivity.types';
import { getAuthorizationStatus } from 'react-native-device-activity';
import SetPayment from "./setup/set-up-payment";
import { SelectionInfo, FocusTimeSlot, PledgeSettings } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface InstructionsProps {
  // define your props here
}

const Instructions: React.FC<InstructionsProps> = (props) => {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const isReturningFromShare = useRef(false);
  const [pledgeValue, setPledgeValue] = useState(10);
  const [focusTimes, setFocusTimes] = useState<FocusTimeSlot[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatus>();
  const [selectionEvent, setSelectionEvent] = useState<SelectionInfo>();

  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string>("");

  useFocusEffect(
    useCallback(() => {
      // Reset payment status and step when screen is focused
      setPaymentSetupComplete(false);
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

  useEffect(() => {
    const initializeAuth = async () => {
      const status = await getAuthorizationStatus();
      setAuthorizationStatus(status);
    };
    initializeAuth();
  }, []);

  return (
    <AppWrapper style={{}}>
      {step !== 4 && <MainHeader />}

      {step === 0 ? (
        <InstructionCarousel />
      ) : step == 1 ? (
        <SetApps
          authorizationStatus={authorizationStatus}
          setAuthorizationStatus={setAuthorizationStatus}
          selectionEvent={selectionEvent}
          setSelectionEvent={setSelectionEvent}
        />
      ) : step == 2 ? (
        <SetFocusTime 
          focusTimes={focusTimes}
          setFocusTimes={setFocusTimes}
        />
      ) : step == 3 ? (
        <SetPledge
          isButtonDisabled={isButtonDisabled}
          setIsButtonDisabled={setIsButtonDisabled}
          pledgeValue={pledgeValue}
          setPledgeValue={setPledgeValue}
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
          setPublishableKey={setPublishableKey}
        />
      ) : step == 6 ? (
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
          onPress={() => {
            if (step === 1) {
              console.log("[Instructions.tsx] step === 1, current selectionEvent before setStep:", JSON.stringify(selectionEvent, null, 2));
            } else if (step === 2) {
              console.log("[Instructions.tsx] step === 2, current focusTimes before setStep:", JSON.stringify(focusTimes, null, 2));
            }
            if (step == 5) {
              if (!paymentSetupComplete) {
                Alert.alert(
                  "Payment Required",
                  "Please complete the payment setup before proceeding."
                );
                return;
              }
              const settingsToSave: PledgeSettings = {
                selectionEvent,
                pledgeValue,
                focusTimes,
                paymentSetupComplete: true,
                termsAccepted: termsAccepted
              };
              console.log("[Instructions.tsx] step === 5, settingsToSave.selectionEvent before saving:", JSON.stringify(settingsToSave.selectionEvent, null, 2));
              console.log("[Instructions.tsx] step === 5, settingsToSave.focusTimes before saving:", JSON.stringify(settingsToSave.focusTimes, null, 2));
              const now = new Date();
              AsyncStorage.setItem(
                'pledgeSettings',
                JSON.stringify(settingsToSave)
              ).then(() => {
                AsyncStorage.setItem('challengeStartDate', now.toISOString()).then(() => {
                  (navigation as any).navigate("Home");
                });
              });
            } else if (step === 1 && authorizationStatus !== AuthorizationStatus.approved) {
              return;
            } else {
              setStep(step + 1);
            }
          }}
          text={step == 5 ? "Track My Pledge" : "Continue"}
          style={{ width: 162 }}
          disabled={
            (step === 1 && !selectionEvent?.familyActivitySelection) ||
            (step === 4 && !termsAccepted) ||
            (step === 5 && !paymentSetupComplete)
          }
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
