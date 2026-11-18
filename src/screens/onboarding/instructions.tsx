import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import SetPledge from "./setup/set-pledge";
import SetTimeLimit from "./setup/set-time-limit";
import SetDuration from "./setup/set-duration";
import SetApps from "./setup/set-apps";
import SetPurpose, { ReasonFilms } from "./setup/set-purpose";
import SocialSignInButtons from "../../components/buttons/social-sign-in-buttons";
import ScreenTimeMirror from "./setup/screen-time-mirror";
import Seal from "./setup/seal";
import SetPayment from "./setup/set-up-payment";
import InkScreen from "../../components/ink/ink-screen";
import PillButton from "../../components/ink/pill-button";
import Caption from "../../components/ink/caption";
import { Dissolve, Line } from "../../components/ink/line";
import { StepName, usePledgeWizard } from "./use-pledge-wizard";

/** The one line at the top of each step. */
const QUESTION: Record<StepName, string> = {
  // Then the report tells it as a story, a week to a lifetime (owner, 17 Nov 2026).
  mirror: "Let's look at your screen time.",
  // One story from the mirror to the seal (owner, 18 Nov 2026), told to the
  // user straight: the time, what it's for, who takes it, how much they get.
  apps: "Which apps take it from you?",
  // After the mirror it answers the number on it (owner, 17 Nov 2026: the
  // onboarding as a story). Without a mirror, PURPOSE_ALONE.
  purpose: "What would you do with that time back?",
  // An instruction, not a riddle (owner, 18 Nov 2026: "How much will you give
  // them a day?" was confusing).
  limit: "Set your daily limit.",
  duration: "How long will you uphold that for?",
  amount: "What's your word worth?",
  signin: "Put your name to it.",
  card: "Put your card down.",
  // Drawn by the seal itself ("I, NAME, PLEDGE.").
  seal: "",
};

/** The purpose question on a pledge without the mirror before it. */
const PURPOSE_ALONE = "What's this time for?";

/**
 * Space between the question and the control, per step (v2 Paper B1–B8,
 * "Content" padding-top). The control is not centred: Paper places it.
 */
const CONTROL_TOP: Record<StepName, number> = {
  mirror: 40,
  apps: 28,
  purpose: 40,
  limit: 40,
  duration: 160,
  amount: 120,
  signin: 28,
  card: 28,
  seal: 0,
};

/**
 * Making a pledge (v2 Paper group "B"): one question per screen, dissolving
 * to the next, solid ivory buttons (owner, 8 Nov 2026). The first pledge
 * opens with the 7-day mirror. Sign-in comes after the amount only when
 * nobody is signed in; the card step is skipped when a card is already on
 * file. The seal is always last and draws its own screen (Paper v2.1 B9).
 */
const Instructions: React.FC = () => {
  const w = usePledgeWizard();
  const { step, steps, index } = w;
  // The card step's "Add a card" lives in the footer (Paper B8); the step
  // hands over its retry once the sheet was closed or failed.
  const [retryCard, setRetryCard] = useState<(() => void) | null>(null);

  const continueLabel = step === "purpose" && w.reasons.length === 0 ? "Skip for now" : "Continue";
  const counter = `Step ${index + 1} of ${steps.length}`;

  if (step === "seal") {
    return (
      <Seal
        counter={counter}
        onBack={w.onBack}
        name={w.name}
        setName={w.setName}
        timeValue={w.timeValue}
        durationDays={w.durationDays}
        pledgeValue={w.pledgeValue}
        starting={w.starting}
        onSeal={w.startPledge}
      />
    );
  }

  return (
    <InkScreen
      onBack={w.canLeave ? w.onBack : undefined}
      backLabel={index > 0 ? "Back" : "Cancel"}
      topRight={<Caption>{counter}</Caption>}
      backdrop={step === "purpose" ? <ReasonFilms reasons={w.reasons} /> : undefined}
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
        <Line
          size="heading"
          text={step === "purpose" && !steps.includes("mirror") ? PURPOSE_ALONE : QUESTION[step]}
          style={styles.question}
        />
        <View style={[styles.control, { paddingTop: CONTROL_TOP[step] }]}>
          {step === "mirror" ? (
            <ScreenTimeMirror
              authorizationStatus={w.authorizationStatus}
              setAuthorizationStatus={w.setAuthorizationStatus}
              onStoryEnd={w.onMirrorStoryEnd}
            />
          ) : step === "apps" ? (
            <SetApps
              authorizationStatus={w.authorizationStatus}
              setAuthorizationStatus={w.setAuthorizationStatus}
              selectionEvent={w.selectionEvent}
              setSelectionEvent={w.setSelectionEvent}
              onSelectionComplete={() => w.setIndex(steps.indexOf("apps") + 1)}
            />
          ) : step === "purpose" ? (
            <SetPurpose
              reasons={w.reasons}
              toggleReason={w.toggleReason}
            />
          ) : step === "limit" ? (
            <SetTimeLimit
              timeValue={w.timeValue}
              setTimeValue={w.setTimeValue}
              familyActivitySelection={w.selectionEvent?.familyActivitySelection ?? null}
            />
          ) : step === "duration" ? (
            <SetDuration durationDays={w.durationDays} setDurationDays={w.setDurationDays} />
          ) : step === "amount" ? (
            <SetPledge pledgeValue={w.pledgeValue} setPledgeValue={w.setPledgeValue} />
          ) : step === "signin" ? (
            w.starting ? null : <SocialSignInButtons tone="dark" onSignedIn={w.onSignedIn} />
          ) : step === "card" ? (
            <SetPayment
              paymentSetupComplete={w.paymentSetupComplete}
              setPaymentSetupComplete={w.setPaymentSetupComplete}
              pledgeValue={w.pledgeValue}
              durationDays={w.durationDays}
              setPublishableKey={() => {}}
              onComplete={w.onCardSaved}
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
});

export default Instructions;
