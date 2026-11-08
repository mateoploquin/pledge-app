import React from "react";
import { View, StyleSheet } from "react-native";
import SetPledge from "./setup/set-pledge";
import SetTimeLimit from "./setup/set-time-limit";
import SetDuration from "./setup/set-duration";
import SetApps from "./setup/set-apps";
import ScreenTimeMirror from "./setup/screen-time-mirror";
import Review from "./setup/review";
import SetPayment from "./setup/set-up-payment";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import Caption from "../../components/ink/caption";
import { Dissolve, Line } from "../../components/ink/line";
import { StepName, usePledgeWizard } from "./use-pledge-wizard";

/** The one line at the top of each step. */
const QUESTION: Record<StepName, string> = {
  mirror: "Your last seven days.",
  apps: "Which apps take the most from you?",
  limit: "How much is enough a day?",
  duration: "For how long?",
  amount: "What's your word worth?",
  review: "Your word, in full.",
  card: "Put your card down.",
};

/**
 * Making a pledge (v2 Paper group "B"): one question per screen, dissolving
 * to the next, solid ivory buttons (owner, 8 Nov 2026). The first pledge
 * opens with the 7-day mirror. Review shows on every pledge; the card step
 * is skipped when a card is already on file.
 */
const Instructions: React.FC = () => {
  const w = usePledgeWizard();
  const { step, steps, index } = w;

  const continueLabel =
    step === "review" ? (w.hasCard ? "Lock it in" : "Add a card to lock it in") : w.isLast ? "Lock it in" : "Continue";

  return (
    <InkScreen
      onBack={w.canLeave ? w.onBack : undefined}
      backLabel={index > 0 ? "Back" : "Cancel"}
      topRight={<Caption>{`Step ${index + 1} of ${steps.length}`}</Caption>}
      footer={
        step === "card" ? null : (
          <>
            <PillButton text={continueLabel} onPress={w.onContinue} disabled={w.continueDisabled} busy={w.starting} />
            {w.canLeave && <PillButton text={index > 0 ? "Back" : "Cancel"} tone="quiet" onPress={w.onBack} />}
          </>
        )
      }
    >
      <Dissolve id={step} style={styles.step}>
        <Line size="heading" text={QUESTION[step]} style={styles.question} />
        <View style={[styles.control, step === "review" && styles.controlTop]}>
          {step === "mirror" ? (
            <ScreenTimeMirror
              authorizationStatus={w.authorizationStatus}
              setAuthorizationStatus={w.setAuthorizationStatus}
            />
          ) : step === "apps" ? (
            <SetApps
              authorizationStatus={w.authorizationStatus}
              setAuthorizationStatus={w.setAuthorizationStatus}
              selectionEvent={w.selectionEvent}
              setSelectionEvent={w.setSelectionEvent}
              onSelectionComplete={() => w.setIndex(steps.indexOf("apps") + 1)}
            />
          ) : step === "limit" ? (
            <SetTimeLimit timeValue={w.timeValue} setTimeValue={w.setTimeValue} />
          ) : step === "duration" ? (
            <SetDuration durationDays={w.durationDays} setDurationDays={w.setDurationDays} />
          ) : step === "amount" ? (
            <SetPledge pledgeValue={w.pledgeValue} setPledgeValue={w.setPledgeValue} />
          ) : step === "review" ? (
            <Review
              selection={w.selectionEvent}
              timeValue={w.timeValue}
              durationDays={w.durationDays}
              pledgeValue={w.pledgeValue}
              askTerms={!w.termsDone}
              termsAccepted={w.termsAccepted}
              setTermsAccepted={w.setTermsAccepted}
            />
          ) : step === "card" ? (
            <SetPayment
              setIsButtonDisabled={w.setIsButtonDisabled}
              paymentSetupComplete={w.paymentSetupComplete}
              setPaymentSetupComplete={w.setPaymentSetupComplete}
              pledgeValue={w.pledgeValue}
              durationDays={w.durationDays}
              setPublishableKey={() => {}}
              onComplete={w.startPledge}
            />
          ) : null}
        </View>
      </Dissolve>
    </InkScreen>
  );
};

const styles = StyleSheet.create({
  step: { flex: 1 },
  question: { marginTop: 24 },
  control: { flex: 1, justifyContent: "center", paddingVertical: 24 },
  controlTop: { justifyContent: "flex-start" },
});

export default Instructions;
