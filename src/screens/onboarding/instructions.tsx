import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
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
import {
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity/build/ReactNativeDeviceActivity.types";
import { getAuthorizationStatus } from "react-native-device-activity";
import SetPayment from "./setup/set-up-payment";
import { SelectionInfo } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface InstructionsProps {
  // define your props here
}

const Instructions: React.FC<InstructionsProps> = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const isReturningFromShare = useRef(false);
  const [pledgeValue, setPledgeValue] = useState(10);
  const [timeValue, setTimeValue] = useState(10);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [authorizationStatus, setAuthorizationStatus] =
    useState<AuthorizationStatusType>();
  const [selectionEvent, setSelectionEvent] = useState<SelectionInfo>();

  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string>(""); // add publishableKey state

  useFocusEffect(
    useCallback(() => {
      setPaymentSetupComplete(false);
      if (!isReturningFromShare.current) {
        setStep(0);
      }
      isReturningFromShare.current = false;
    }, [])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      if (
        (navigation as any).getState().routes.slice(-1)[0]?.name ===
        "SharePledge"
      ) {
        isReturningFromShare.current = true;
      }

      if (
        (navigation as any).getState().routes.slice(-1)[0]?.name ===
        "SelectApps"
      ) {
        isReturningFromShare.current = true;
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const initializeAuth = async () => {
      const status = getAuthorizationStatus();
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
        <SetTimeLimit timeValue={timeValue} setTimeValue={setTimeValue} />
      ) : step == 3 ? (
        <SetPledge pledgeValue={pledgeValue} setPledgeValue={setPledgeValue} />
      ) : step == 4 ? (
        <AcceptTerms
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
        />
      ) : step == 5 ? (
        <SetPayment
          setIsButtonDisabled={setIsButtonDisabled}
          paymentSetupComplete={paymentSetupComplete}
          setPaymentSetupComplete={setPaymentSetupComplete}
          pledgeValue={pledgeValue}
          timeValue={timeValue}
          setPublishableKey={setPublishableKey}
        />
      ) : step == 6 ? (
        <ChallengeOn />
      ) : null}

      <View style={styles.buttonContainer}>
        <MainButton
          onPress={() => {
            if (step == 5) {
              if (!paymentSetupComplete) {
                Alert.alert(
                  "Payment Required",
                  "Please complete the payment setup before proceeding."
                );
                return;
              }
              AsyncStorage.setItem(
                "pledgeSettings",
                JSON.stringify({
                  selectionEvent,
                  pledgeValue,
                  timeValue,
                  paymentSetupComplete: true,
                })
              ).then(() => {
                //@ts-ignore
                navigation.navigate("Home");
              });
            } else if (
              step === 1 &&
              authorizationStatus !== AuthorizationStatus.approved
            ) {
              return;
            } else {
              setStep(step + 1);
            }
          }}
          text={step == 5 ? "Track My Pledge" : "Continue"}
          style={styles.mainButton}
          disabled={
            (step === 4 && !termsAccepted) || // Disable on AcceptTerms step if unchecked
            (step === 5 && !paymentSetupComplete) // Disable on Payment step if setup not complete
          }
        />
        {step !== 5 && step > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setStep(step - 1);
            }}
          >
            <Text style={styles.backButton}>Go Back</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </AppWrapper>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    bottom: 71,
    zIndex: 100,
    alignSelf: "center",
  },
  mainButton: {
    width: 162,
  },
  backButton: {
    textDecorationLine: "underline",
    color: colors.orange,
    textAlign: "center",
    marginTop: 16,
  },
});

export default Instructions;
