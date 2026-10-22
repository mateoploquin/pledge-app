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
import AcceptTerms from "./setup/accept-terms";
import {
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity/build/ReactNativeDeviceActivity.types";
import { getAuthorizationStatus } from "react-native-device-activity";
import SetPayment from "./setup/set-up-payment";
import { PledgeSettings, SelectionInfo } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { startChallengeMonitoring } from "../home/home.controller";
import Animated, { FadeInRight, FadeInLeft, FadeOutLeft, FadeOutRight } from "react-native-reanimated";
import { haptics } from "../../utils/haptics";

interface InstructionsProps {
  // define your props here
}

const Instructions: React.FC<InstructionsProps> = () => {
  const navigation = useNavigation();
  const FIRST_STEP = 1; // app selection; the old explainer carousel (step 0) was removed
  const [step, setStepState] = useState(FIRST_STEP);
  const direction = useRef<"forward" | "back">("forward");
  const setStep = (next: number) => {
    direction.current = next >= step ? "forward" : "back";
    setStepState(next);
  };
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
        setStep(FIRST_STEP);
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

  const [starting, setStarting] = useState(false);

  /** Saves settings, registers the Screen Time schedule and opens Home. */
  const startChallenge = async () => {
    if (starting) return;
    if (!selectionEvent?.familyActivitySelection) {
      Alert.alert("No apps selected", "Go back and choose the apps you want to limit.");
      return;
    }
    const settings: PledgeSettings = {
      selectionEvent,
      pledgeValue,
      timeValue,
      paymentSetupComplete: true,
    };
    try {
      setStarting(true);
      setIsButtonDisabled(true);
      await startChallengeMonitoring(settings, { fresh: true });
      await AsyncStorage.multiSet([
        ["pledgeSettings", JSON.stringify(settings)],
        ["challengeStartDate", new Date().toISOString()],
      ]);
      haptics.success();
      //@ts-ignore
      navigation.replace("Home");
    } catch (error: any) {
      console.error("Could not start the challenge:", error);
      Alert.alert(
        "Could not start monitoring",
        error?.message ?? "Please check Screen Time permissions and try again."
      );
    } finally {
      setStarting(false);
      setIsButtonDisabled(false);
    }
  };

  return (
    <AppWrapper style={{}}>
      {step !== 4 && <MainHeader />}

      <Animated.View
        key={step}
        style={styles.stepContainer}
        entering={(direction.current === "forward" ? FadeInRight : FadeInLeft).duration(380)}
        exiting={(direction.current === "forward" ? FadeOutLeft : FadeOutRight).duration(220)}
      >
      {step == 1 ? (
        <SetApps
          authorizationStatus={authorizationStatus}
          setAuthorizationStatus={setAuthorizationStatus}
          selectionEvent={selectionEvent}
          setSelectionEvent={setSelectionEvent}
          onSelectionComplete={() => setStep(2)}
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
          onComplete={startChallenge}
        />
      ) : step == 6 ? (
        <ChallengeOn />
      ) : null}
      </Animated.View>

      <View style={styles.buttonContainer}>
        <MainButton
          onPress={async () => {
            if (step == 5) {
              await startChallenge();
            } else {
              setStep(step + 1);
            }
          }}
          text={step == 5 ? (starting ? "Starting…" : "Track My Pledge") : "Continue"}
          style={styles.mainButton}
          disabled={
            isButtonDisabled ||
            (step === 1 && !selectionEvent?.familyActivitySelection) ||
            (step === 4 && !termsAccepted) || // Disable on AcceptTerms step if unchecked
            (step === 5 && !paymentSetupComplete) // Disable on Payment step if setup not complete
          }
        />
        {step !== 5 && step > FIRST_STEP ? (
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
  stepContainer: {
    flex: 1,
  },
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
