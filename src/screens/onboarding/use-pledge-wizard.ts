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
import { addPledge, hasAcceptedTerms, loadPledges, markTermsAccepted, newPledgeId } from "../../services/pledges";
import { sendPledgeData } from "../../services/sendPledgeData";
import { fetchHasCard } from "../../services/stripe-api";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { registerDevice } from "../../services/devices";
import { track } from "../../services/analytics";

export type StepName = "mirror" | "apps" | "limit" | "duration" | "amount" | "review" | "signin" | "card";

/**
 * The state of making a pledge: which steps apply, what's been chosen, when
 * Continue is allowed, and starting the pledge. The start order matters:
 * backend, then Screen Time schedule, then local storage, then Home. Steps
 * must mount one at a time, because the mirror and card steps act on mount.
 * No account is needed until the pledge is about to cost something: the
 * sign-in step comes after Review, only when nobody is signed in (owner,
 * 10 Nov 2026).
 */
export const usePledgeWizard = () => {
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
      "apps",
      "limit",
      "duration",
      "amount",
      // Review shows on every pledge; its terms checkbox only until accepted.
      "review",
      ...(account === "ready" ? [] : (["signin"] as StepName[])),
      ...(hasCard ? [] : (["card"] as StepName[])),
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
    if (termsAccepted) track("terms_accepted");
  }, [termsAccepted]);

  useEffect(() => {
    setAuthorizationStatus(getAuthorizationStatus());
    hasAcceptedTerms().then(setTermsDone).catch(() => {});
    loadPledges()
      .then((list) => setFirstPledge(list.length === 0))
      .catch(() => {});
    return onAuthStateChanged(auth, (user) => {
      if (user) refreshAccount(user);
      else setAccount("signedOut");
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
    };
    try {
      setStarting(true);
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Sign in again to start a pledge.");
      await sendPledgeData({ id: pledge.id, pledgeValue, timeValue, durationDays }, await user.getIdToken());
      await startPledgeMonitoring(pledge, { fresh: true });
      await addPledge(pledge);
      if (termsAccepted) await markTermsAccepted();
      registerDevice();
      track("pledge_started", {
        limit_minutes: timeValue,
        duration_days: durationDays,
        pledge_value: pledgeValue,
        first_pledge: firstPledge,
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
  }, [starting, selectionEvent, pledgeValue, timeValue, durationDays, termsAccepted, firstPledge, navigation]);

  /**
   * Signed in on the sign-in step. With a card on file the pledge starts
   * now; otherwise the steps drop "signin" and the card step takes its place.
   */
  const onSignedIn = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (await refreshAccount(user)) {
      // Signin and card both drop out; stay on Review while it starts.
      setIndex(steps.indexOf("review"));
      await startPledge();
    }
  };

  const isLast = index >= steps.length - 1;

  const onContinue = async () => {
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
    (step === "review" && !termsDone && !termsAccepted) ||
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
    termsAccepted,
    setTermsAccepted,
    authorizationStatus,
    setAuthorizationStatus,
    paymentSetupComplete,
    setPaymentSetupComplete,
    termsDone,
    hasCard,
    signedIn: account === "ready",
    onSignedIn,
  };
};
