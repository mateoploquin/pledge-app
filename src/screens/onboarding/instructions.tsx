import React from "react";
import { View, StyleSheet } from "react-native";
import SetPledge from "./setup/set-pledge";
import SetTimeLimit from "./setup/set-time-limit";
import SetDuration from "./setup/set-duration";
import SetApps from "./setup/set-apps";
import ScreenTimeMirror from "./setup/screen-time-mirror";
import AcceptTerms from "./setup/accept-terms";
import SetPayment from "./setup/set-up-payment";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import { Dissolve, Line } from "../../components/ink/line";
import { StepName, usePledgeWizard } from "./use-pledge-wizard";
import { color } from "../../theme/tokens";

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
 * Making a pledge: one question per screen, dissolving to the next. The
 * first pledge opens with the 7-day mirror (the deal was told on the film
 * after sign-in). Terms
 * are asked once per device and the card step is skipped when a card is
 * already on file, so a second pledge takes four taps.
 */
const Instructions: React.FC = () => {
  const {
    steps,
    step,
    index,
    setIndex,
    isLast,
    canLeave,
    continueDisabled,
    starting,
    onContinue,
    onBack,
    startPledge,
    selectionEvent,
    setSelectionEvent,
    timeValue,
    setTimeValue,
    durationDays,
    setDurationDays,
    pledgeValue,
    setPledgeValue,
    termsAccepted,
    setTermsAccepted,
    authorizationStatus,
    setAuthorizationStatus,
    paymentSetupComplete,
    setPaymentSetupComplete,
    setIsButtonDisabled,
  } = usePledgeWizard();

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
    backgroundColor: color.divider,
  },
  dotOn: {
    backgroundColor: color.text,
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
