import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import SetPledge from "./setup/set-pledge";
import SetTimeLimit from "./setup/set-time-limit";
import SetDuration from "./setup/set-duration";
import SetApps from "./setup/set-apps";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";
import ScreenTimeMirror from "./setup/screen-time-mirror";
import Review, { TermsCheck } from "./setup/review";
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
  signin: "Put your name to it.",
  card: "Put your card down.",
};

/**
 * Space between the question and the control, per step (v2 Paper B1–B8,
 * "Content" padding-top). The control is not centred: Paper places it.
 */
const CONTROL_TOP: Record<StepName, number> = {
  mirror: 28,
  apps: 28,
  limit: 120,
  duration: 160,
  amount: 120,
  review: 24,
  signin: 28,
  card: 28,
};

/**
 * Making a pledge (v2 Paper group "B"): one question per screen, dissolving
 * to the next, solid ivory buttons (owner, 8 Nov 2026). The first pledge
 * opens with the 7-day mirror. Review shows on every pledge; sign-in comes
 * after it only when nobody is signed in; the card step is skipped when a
 * card is already on file.
 */
const Instructions: React.FC = () => {
  const w = usePledgeWizard();
  const { step, steps, index } = w;
  // The card step's "Add a card" lives in the footer (Paper B8); the step
  // hands over its retry once the sheet was closed or failed.
  const [retryCard, setRetryCard] = useState<(() => void) | null>(null);

  const continueLabel =
    step === "review"
      ? !w.signedIn
        ? "Sign in to lock it in"
        : w.hasCard
          ? "Lock it in"
          : "Add a card to lock it in"
      : w.isLast
        ? "Lock it in"
        : "Continue";

  return (
    <InkScreen
      onBack={w.canLeave ? w.onBack : undefined}
      backLabel={index > 0 ? "Back" : "Cancel"}
      topRight={<Caption>{`Step ${index + 1} of ${steps.length}`}</Caption>}
      footer={
        step === "signin" ? (
          // The provider buttons are the step's action; only Back sits here.
          <PillButton text="Back" tone="quiet" onPress={w.onBack} />
        ) : step === "card" ? (
          retryCard ? (
            <>
              <PillButton text="Add a card" onPress={retryCard} />
              {w.canLeave && <PillButton text="Back" tone="quiet" onPress={w.onBack} />}
            </>
          ) : null
        ) : step === "review" ? (
          // Paper B7: the terms sit over the button, 16 apart. The quiet Back
          // stays, as on every step (rebrand only, same flow).
          <View style={styles.reviewFooter}>
            {!w.termsDone && <TermsCheck termsAccepted={w.termsAccepted} setTermsAccepted={w.setTermsAccepted} />}
            <PillButton text={continueLabel} onPress={w.onContinue} disabled={w.continueDisabled} busy={w.starting} />
            {w.canLeave && <PillButton text="Back" tone="quiet" onPress={w.onBack} />}
          </View>
        ) : (
          <>
            <PillButton text={continueLabel} onPress={w.onContinue} disabled={w.continueDisabled} busy={w.starting} />
            {/* No quiet Cancel on "Your last seven days" (owner, 9 Nov 2026); the chevron still leaves. */}
            {w.canLeave && step !== "mirror" && (
              <PillButton text={index > 0 ? "Back" : "Cancel"} tone="quiet" onPress={w.onBack} />
            )}
          </>
        )
      }
    >
      <Dissolve id={step} style={styles.step}>
        <Line size="heading" text={QUESTION[step]} style={styles.question} />
        <View style={[styles.control, { paddingTop: CONTROL_TOP[step] }]}>
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
            />
          ) : step === "signin" ? (
            w.starting ? null : <SocialSignInButtons tone="dark" onSignedIn={w.onSignedIn} />
          ) : step === "card" ? (
            <SetPayment
              paymentSetupComplete={w.paymentSetupComplete}
              setPaymentSetupComplete={w.setPaymentSetupComplete}
              pledgeValue={w.pledgeValue}
              durationDays={w.durationDays}
              setPublishableKey={() => {}}
              onComplete={w.startPledge}
              onRetryChange={(retry) => setRetryCard(() => retry)}
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
  control: { flex: 1 },
  reviewFooter: { alignSelf: "stretch", gap: 16, marginBottom: 8 },
});

export default Instructions;
