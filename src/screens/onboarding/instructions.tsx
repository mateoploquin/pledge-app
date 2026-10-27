import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import AppWrapper from "../../components/layout/app-wrapper";
import MainHeader from "../../components/headers/main-header";
import MainButton from "../../components/buttons/main-button";
import colors from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";
import SetPledge from "./setup/set-pledge";
import SetTimeLimit from "./setup/set-time-limit";
import SetDuration from "./setup/set-duration";
import SetApps from "./setup/set-apps";
import AcceptTerms from "./setup/accept-terms";
import {
  AuthorizationStatus,
  AuthorizationStatusType,
} from "react-native-device-activity/build/ReactNativeDeviceActivity.types";
import { getAuthorizationStatus } from "react-native-device-activity";
import SetPayment from "./setup/set-up-payment";
import { Pledge, SelectionInfo } from "../../types";
import { startPledgeMonitoring } from "../home/home.controller";
import { CHALLENGE_DURATION } from "../home/home.constants";
import Animated, { FadeInRight, FadeInLeft, FadeOutLeft, FadeOutRight } from "react-native-reanimated";
import { haptics } from "../../utils/haptics";
import { addPledge, hasAcceptedTerms, markTermsAccepted, newPledgeId } from "../../services/pledges";
import { sendPledgeData } from "../../services/sendPledgeData";
import { fetchHasCard } from "../../services/stripe-api";
import { auth } from "../../firebaseConfig";

type StepName = "apps" | "limit" | "duration" | "amount" | "terms" | "card";

/**
 * Pledge creation wizard. Terms are asked once per device and the card step
 * is skipped when a card is already on file, so a second pledge takes four taps.
 */
const Instructions: React.FC = () => {
  const navigation = useNavigation<any>();

  const [selectionEvent, setSelectionEvent] = useState<SelectionInfo>();
  const [timeValue, setTimeValue] = useState(10);
  const [durationDays, setDurationDays] = useState(CHALLENGE_DURATION);
  const [pledgeValue, setPledgeValue] = useState(5);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatusType>();

  // Unknown until checked; while unknown we assume the step is needed.
  const [termsDone, setTermsDone] = useState(false);
  const [hasCard, setHasCard] = useState(false);

  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [starting, setStarting] = useState(false);

  const steps = useMemo<StepName[]>(
    () => [
      "apps",
      "limit",
      "duration",
      "amount",
      ...(termsDone ? [] : (["terms"] as StepName[])),
      ...(hasCard ? [] : (["card"] as StepName[])),
    ],
    [termsDone, hasCard]
  );
  const [index, setIndexState] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];
  const direction = useRef<"forward" | "back">("forward");
  const setIndex = (next: number) => {
    direction.current = next >= index ? "forward" : "back";
    setIndexState(next);
  };

  useEffect(() => {
    setAuthorizationStatus(getAuthorizationStatus());
    hasAcceptedTerms().then(setTermsDone).catch(() => {});
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        setHasCard(await fetchHasCard(await user.getIdToken()));
      } catch (e) {
        console.warn("Could not check for a saved card:", e);
      }
    })();
  }, []);

  /** Records the pledge, registers its Screen Time schedule and opens Home. */
  const startPledge = useCallback(async () => {
    if (starting) return;
    if (!selectionEvent?.familyActivitySelection) {
      Alert.alert("No apps selected", "Go back and choose the apps you want to limit.");
      return;
    }
    const pledge: Pledge = {
      id: newPledgeId(),
      selectionEvent,
      pledgeValue,
      timeValue,
      durationDays,
      startedAt: new Date().toISOString(),
    };
    try {
      setStarting(true);
      setIsButtonDisabled(true);
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Sign in again to start a pledge.");
      await sendPledgeData(
        { id: pledge.id, pledgeValue, timeValue, durationDays },
        await user.getIdToken()
      );
      await startPledgeMonitoring(pledge, { fresh: true });
      await addPledge(pledge);
      if (termsAccepted) await markTermsAccepted();
      haptics.success();
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error: any) {
      console.error("Could not start the pledge:", error);
      Alert.alert(
        "Could not start your pledge",
        error?.response?.data?.error ??
          error?.message ??
          "Please check Screen Time permissions and try again."
      );
    } finally {
      setStarting(false);
      setIsButtonDisabled(false);
    }
  }, [starting, selectionEvent, pledgeValue, timeValue, durationDays, termsAccepted, navigation]);

  const isLast = index >= steps.length - 1;

  const onContinue = async () => {
    if (isLast) {
      await startPledge();
    } else {
      setIndex(index + 1);
    }
  };

  const continueDisabled =
    isButtonDisabled ||
    (step === "apps" && !selectionEvent?.familyActivitySelection) ||
    (step === "terms" && !termsAccepted) ||
    (step === "card" && !paymentSetupComplete);

  return (
    <AppWrapper style={{}}>
      {step !== "terms" && <MainHeader />}

      <Animated.View
        key={step}
        style={styles.stepContainer}
        entering={(direction.current === "forward" ? FadeInRight : FadeInLeft).duration(380)}
        exiting={(direction.current === "forward" ? FadeOutLeft : FadeOutRight).duration(220)}
      >
        {step === "apps" ? (
          <SetApps
            authorizationStatus={authorizationStatus}
            setAuthorizationStatus={setAuthorizationStatus}
            selectionEvent={selectionEvent}
            setSelectionEvent={setSelectionEvent}
            onSelectionComplete={() => setIndex(1)}
          />
        ) : step === "limit" ? (
          <SetTimeLimit timeValue={timeValue} setTimeValue={setTimeValue} />
        ) : step === "duration" ? (
          <SetDuration durationDays={durationDays} setDurationDays={setDurationDays} />
        ) : step === "amount" ? (
          <SetPledge pledgeValue={pledgeValue} setPledgeValue={setPledgeValue} />
        ) : step === "terms" ? (
          <AcceptTerms termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted} />
        ) : step === "card" ? (
          <SetPayment
            setIsButtonDisabled={setIsButtonDisabled}
            paymentSetupComplete={paymentSetupComplete}
            setPaymentSetupComplete={setPaymentSetupComplete}
            pledgeValue={pledgeValue}
            durationDays={durationDays}
            setPublishableKey={() => {}}
            onComplete={startPledge}
          />
        ) : null}
      </Animated.View>

      <View style={[styles.buttonContainer, step === "card" && { display: "none" }]}>
        <MainButton
          onPress={onContinue}
          text={isLast ? (starting ? "Starting…" : "Start My Pledge") : "Continue"}
          style={styles.mainButton}
          disabled={continueDisabled}
        />
        <TouchableOpacity
          onPress={() => {
            if (index > 0) setIndex(index - 1);
            else if (navigation.canGoBack()) navigation.goBack();
          }}
        >
          <Text style={styles.backButton}>
            {index > 0 ? "Go Back" : navigation.canGoBack() ? "Cancel" : ""}
          </Text>
        </TouchableOpacity>
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
