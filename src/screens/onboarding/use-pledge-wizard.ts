import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  AuthorizationStatusType,
} from "react-native-device-activity/build/ReactNativeDeviceActivity.types";
import { AuthorizationStatus, getAuthorizationStatus } from "react-native-device-activity";
import { isActivityReportAvailable } from "../../../modules/pledge-activity-report";
import { Pledge, SelectionInfo } from "../../types";
import { startPledgeMonitoring } from "../home/home.controller";
import { CHALLENGE_DURATION } from "../home/home.constants";
import { haptics } from "../../utils/haptics";
import { addPledge, loadPledges, markTermsAccepted, newPledgeId } from "../../services/pledges";
import { sendPledgeData } from "../../services/sendPledgeData";
import { fetchHasCard } from "../../services/stripe-api";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { registerDevice } from "../../services/devices";
import { track } from "../../services/analytics";

export type StepName = "mirror" | "apps" | "purpose" | "limit" | "duration" | "amount" | "signin" | "card" | "seal";

/** What the time is for: one tap. */
export const REASONS = ["Sleep", "Focus", "People", "Presence"] as const;
export type Reason = (typeof REASONS)[number];

/** "Mateo" from "Mateo Ploquin"; empty when the account has no name. */
const firstName = (displayName?: string | null) => (displayName ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * The state of making a pledge: which steps apply, what's been chosen, when
 * Continue is allowed, and starting the pledge. The start order matters:
 * backend, then Screen Time schedule, then local storage, then Home. Steps
 * must mount one at a time, because the mirror and card steps act on mount.
 * No account is needed until the pledge is about to cost something: sign-in
 * and the card come after the amount, only when needed (owner, 10 Nov 2026).
 * The seal is always last (owner, 16 Nov 2026), so holding it really starts
 * the pledge and the name on it comes from the account.
 */
export const usePledgeWizard = () => {
  const navigation = useNavigation<any>();

  const [selectionEvent, setSelectionEvent] = useState<SelectionInfo>();
  const [timeValue, setTimeValue] = useState(30);
  const [durationDays, setDurationDays] = useState(CHALLENGE_DURATION);
  const [pledgeValue, setPledgeValue] = useState(10);
  // What the time is for: one tap, optional; saved with the pledge as "People".
  // No text box (owner, 17 Nov 2026: the keyboard covered the picks).
  const [reason, setReason] = useState<Reason | null>(null);
  const purpose = reason ?? "";
  // "I, ___, pledge." From the account once signed in; they can change it on the seal.
  const [name, setName] = useState("");
  const [authorizationStatus, setAuthorizationStatus] = useState<AuthorizationStatusType>();

  const [hasCard, setHasCard] = useState(false);
  // "ready" once someone is signed in and we know whether they have a card.
  // Both land together, so the card step never mounts (and opens Stripe)
  // for someone who already has one.
  const [account, setAccount] = useState<"unknown" | "signedOut" | "ready">("unknown");
  // The mirror step is for the first pledge only; after that Home shows the number.
  const [firstPledge, setFirstPledge] = useState(true);

  const [paymentSetupComplete, setPaymentSetupComplete] = useState(false);
  const [starting, setStarting] = useState(false);

  const steps = useMemo<StepName[]>(
    () => [
      ...(firstPledge && isActivityReportAvailable() ? (["mirror"] as StepName[]) : []),
      // Straight after the mirror: the time it showed, then what it's for
      // (owner, 17 Nov 2026), then which apps take it.
      "purpose",
      "apps",
      "limit",
      "duration",
      "amount",
      ...(account === "ready" ? [] : (["signin"] as StepName[])),
      ...(hasCard ? [] : (["card"] as StepName[])),
      // Replaces Review and the terms checkbox: holding it agrees and starts.
      "seal",
    ],
    [firstPledge, account, hasCard]
  );
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];

  // The pledge steps are one screen, so screen tracking cannot see them.
  useEffect(() => {
    track("pledge_step_viewed", { step, position: index + 1, steps: steps.length, first_pledge: firstPledge });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    setAuthorizationStatus(getAuthorizationStatus());
    loadPledges()
      .then((list) => setFirstPledge(list.length === 0))
      .catch(() => {});
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setName((n) => n || firstName(user.displayName));
        refreshAccount(user);
      } else setAccount("signedOut");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Learns whether the signed-in user has a card, then marks the account ready. */
  const refreshAccount = async (user: User): Promise<boolean> => {
    let card = false;
    try {
      card = await fetchHasCard(await user.getIdToken());
    } catch (e) {
      console.warn("Could not check for a saved card:", e);
    }
    setHasCard(card);
    setAccount("ready");
    return card;
  };

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
      ...(purpose ? { purpose } : {}),
    };
    try {
      setStarting(true);
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Sign in again to start a pledge.");
      await sendPledgeData(
        { id: pledge.id, pledgeValue, timeValue, durationDays, purpose: pledge.purpose },
        await user.getIdToken()
      );
      await startPledgeMonitoring(pledge, { fresh: true });
      await addPledge(pledge);
      // Holding the seal is agreeing to the terms ("Sealing means you agree…").
      await markTermsAccepted();
      track("terms_accepted");
      registerDevice();
      track("pledge_started", {
        limit_minutes: timeValue,
        duration_days: durationDays,
        pledge_value: pledgeValue,
        first_pledge: firstPledge,
        has_purpose: !!pledge.purpose,
      });
      haptics.success();
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error: any) {
      console.error("Could not start the pledge:", error);
      track("pledge_start_failed", {
        reason: String(error?.response?.data?.error ?? error?.message ?? "unknown").slice(0, 200),
      });
      Alert.alert(
        "Could not start your pledge",
        error?.response?.data?.error ?? error?.message ?? "Please check Screen Time permissions and try again."
      );
    } finally {
      setStarting(false);
    }
  }, [starting, selectionEvent, pledgeValue, timeValue, durationDays, purpose, firstPledge, navigation]);

  /**
   * Signed in on the sign-in step. The steps drop "signin", so the same
   * index now points at the card step, or at the seal when a card is on file.
   */
  const onSignedIn = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setName((n) => n || firstName(user.displayName));
    await refreshAccount(user);
  };

  /** Card saved: the card step drops out and the same index is the seal. */
  const onCardSaved = () => {
    setPaymentSetupComplete(true);
    setHasCard(true);
  };

  const isLast = index >= steps.length - 1;

  const onContinue = async () => {
    // Only which reason goes to analytics.
    if (step === "purpose") {
      track(purpose ? "purpose_set" : "purpose_skipped", { reason: reason ?? "none" });
    }
    if (isLast) await startPledge();
    else setIndex(index + 1);
  };

  const onBack = () => {
    if (index > 0) {
      track("pledge_step_back", { step });
      setIndex(index - 1);
    } else if (navigation.canGoBack()) {
      track("pledge_cancelled", { step });
      navigation.goBack();
    }
  };

  // Only the current step decides, so going Back never leaves a step's
  // button off (a shared "disabled" flag set by the card step used to).
  const continueDisabled =
    starting ||
    (step === "mirror" && authorizationStatus !== AuthorizationStatus.approved) ||
    (step === "apps" && !selectionEvent?.familyActivitySelection) ||
    (step === "amount" && pledgeValue < 1) ||
    step === "signin" ||
    (step === "card" && !paymentSetupComplete);

  const canLeave = index > 0 || navigation.canGoBack();

  return {
    navigation,
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
    purpose,
    reason,
    setReason,
    name,
    setName,
    onCardSaved,
    authorizationStatus,
    setAuthorizationStatus,
    paymentSetupComplete,
    setPaymentSetupComplete,
    hasCard,
    signedIn: account === "ready",
    onSignedIn,
  };
};
