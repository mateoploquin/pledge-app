import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  AuthorizationStatusType,
} from "react-native-device-activity/build/ReactNativeDeviceActivity.types";
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import SetPledge from "./setup/set-pledge";
import SetTimeLimit from "./setup/set-time-limit";
import SetDuration from "./setup/set-duration";
import SetApps from "./setup/set-apps";
import ScreenTimeMirror from "./setup/screen-time-mirror";
import { isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import AcceptTerms from "./setup/accept-terms";
import SetPayment from "./setup/set-up-payment";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Dissolve, Line } from "../../components/ink/line";
import { Pledge, SelectionInfo } from "../../types";
import { startPledgeMonitoring } from "../home/home.controller";
import { CHALLENGE_DURATION } from "../home/home.constants";
import { haptics } from "../../utils/haptics";
import { addPledge, hasAcceptedTerms, loadPledges, markTermsAccepted, newPledgeId } from "../../services/pledges";
import { sendPledgeData } from "../../services/sendPledgeData";
import { fetchHasCard } from "../../services/stripe-api";
import { auth } from "../../firebaseConfig";
import { registerDevice } from "../../services/devices";

type StepName = "mirror" | "apps" | "limit" | "duration" | "amount" | "terms" | "card";

/** The one line at the top of each step. */
const QUESTION: Record<StepName, string> = {
  mirror: "Your last\n*seven* days.",
  apps: "Which apps take\nthe *most* from you?",
  limit: "How much is\n*enough* a day?",
  duration: "For how\n*long?*",
  amount: "What's your\nword *worth?*",
  terms: "The *rules.*",
  card: "Put your card\n*down.*",
};

/**
 * Making a pledge: one question per screen, dissolving to the next. Terms
 * are asked once per device and the card step is skipped when a card is
 * already on file, so a second pledge takes four taps.
 */
const Instructions: React.FC = () => {
  const navigation = useNavigation<any>();

  const [selectionEvent, setSelectionEvent] = useState<SelectionInfo>();
  const [timeValue, setTimeValue] = useState(30);
  const [durationDays, setDurationDays] = useState(CHALLENGE_DURATION);
  const [pledgeValue, setPledgeValue] = useState(10);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatusType>();

  // Unknown until checked; while unknown we assume the step is needed.
  const [termsDone, setTermsDone] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  // The mirror step is for the first pledge only; after that Home shows the number.
  const [firstPledge, setFirstPledge] = useState(true);

  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [starting, setStarting] = useState(false);

  const steps = useMemo<StepName[]>(
    () => [
      ...(firstPledge && isActivityReportAvailable() ? (["mirror"] as StepName[]) : []),
      "apps",
      "limit",
      "duration",
      "amount",
      ...(termsDone ? [] : (["terms"] as StepName[])),
      ...(hasCard ? [] : (["card"] as StepName[])),
    ],
    [firstPledge, termsDone, hasCard]
  );
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];

  useEffect(() => {
    setAuthorizationStatus(getAuthorizationStatus());
    hasAcceptedTerms().then(setTermsDone).catch(() => {});
    loadPledges()
      .then((list) => setFirstPledge(list.length === 0))
      .catch(() => {});
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
      Alert.alert("No apps chosen", "Go back and choose the apps you want to limit.");
      return;
    }
    const pledge: Pledge = {
      id: newPledgeId(),
      selectionEvent,
      pledgeValue,
      timeValue,
      durationDays,
      startedAt: new Date().toISOString(),
      synced: true,
    };
    try {
      setStarting(true);
      setIsButtonDisabled(true);
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Sign in again to start a pledge.");
      await sendPledgeData({ id: pledge.id, pledgeValue, timeValue, durationDays }, await user.getIdToken());
      await startPledgeMonitoring(pledge, { fresh: true });
      await addPledge(pledge);
      if (termsAccepted) await markTermsAccepted();
      registerDevice();
      haptics.success();
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error: any) {
      console.error("Could not start the pledge:", error);
      Alert.alert(
        "Could not start your pledge",
        error?.response?.data?.error ?? error?.message ?? "Please check Screen Time permissions and try again."
      );
    } finally {
      setStarting(false);
      setIsButtonDisabled(false);
    }
  }, [starting, selectionEvent, pledgeValue, timeValue, durationDays, termsAccepted, navigation]);

  const isLast = index >= steps.length - 1;

  const onContinue = async () => {
    if (isLast) await startPledge();
    else setIndex(index + 1);
  };

  const onBack = () => {
    if (index > 0) setIndex(index - 1);
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const continueDisabled =
    isButtonDisabled ||
    (step === "mirror" && authorizationStatus !== AuthorizationStatus.approved) ||
    (step === "apps" && !selectionEvent?.familyActivitySelection) ||
    (step === "amount" && pledgeValue < 1) ||
    (step === "terms" && !termsAccepted) ||
    (step === "card" && !paymentSetupComplete);

  const canLeave = index > 0 || navigation.canGoBack();

  return (
    <InkScreen
      footer={
        step === "card" ? null : (
          <>
            <PillButton
              text={isLast ? "Lock it in" : "Continue"}
              onPress={onContinue}
              disabled={continueDisabled}
              busy={starting}
            />
            {canLeave && <PillButton text={index > 0 ? "Back" : "Cancel"} tone="quiet" onPress={onBack} />}
          </>
        )
      }
    >
      <View style={styles.progress}>
        {steps.map((s, i) => (
          <View key={s} style={[styles.dot, i <= index && styles.dotOn]} />
        ))}
      </View>

      <Dissolve id={step} style={styles.step}>
        <Line text={QUESTION[step]} />
        <View style={styles.control}>
          {step === "mirror" ? (
            <ScreenTimeMirror
              authorizationStatus={authorizationStatus}
              setAuthorizationStatus={setAuthorizationStatus}
            />
          ) : step === "apps" ? (
            <SetApps
              authorizationStatus={authorizationStatus}
              setAuthorizationStatus={setAuthorizationStatus}
              selectionEvent={selectionEvent}
              setSelectionEvent={setSelectionEvent}
              onSelectionComplete={() => setIndex(steps.indexOf("apps") + 1)}
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
        </View>
      </Dissolve>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  progress: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    marginBottom: 28,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(248, 244, 236, 0.22)",
  },
  dotOn: {
    backgroundColor: "#F8F4EC",
  },
  step: {
    flex: 1,
  },
  control: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },
});

export default Instructions;
