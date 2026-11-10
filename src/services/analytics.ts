// Product analytics (PostHog, US cloud). Screens and taps are captured
// automatically by the provider in App.tsx; the named events below mark the
// steps worth a funnel. See docs/architecture.md, "Analytics".
//
// Never put Screen Time data in an event (which apps, how long): Apple keeps
// it on the device, and so do we. Never put card or password data either.

import PostHog from "posthog-react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { POSTHOG_HOST, POSTHOG_KEY } from "../config";

export const posthog = new PostHog(POSTHOG_KEY, {
  host: POSTHOG_HOST,
  // Application Opened / Backgrounded / Installed / Updated.
  captureAppLifecycleEvents: true,
  disabled: !POSTHOG_KEY,
});

// Lets dev builds on the owner's phone be filtered out of real numbers.
posthog.register({ build: __DEV__ ? "dev" : "release" });

/** Every named event, so a typo cannot start a new event in PostHog. */
export type AnalyticsEvent =
  // Opener ("Start" or "I already have an account") and sign-in, which the
  // pledge steps ask for just before the card.
  | "opener_state_viewed"
  | "opener_started"
  | "sign_up_completed"
  | "sign_in_completed"
  | "sign_in_failed"
  // Account.
  | "signed_out"
  | "account_deleted"
  // Making a pledge: one event per step shown, then the result.
  | "pledge_step_viewed"
  | "pledge_step_back"
  | "pledge_cancelled"
  | "screen_time_authorization"
  | "apps_selected"
  | "terms_accepted"
  | "card_added"
  | "card_failed"
  | "pledge_started"
  | "pledge_start_failed"
  // A running pledge.
  | "break_started"
  | "break_failed"
  | "surrender_opened"
  | "pledge_surrendered"
  | "pledge_completed"
  | "pledge_forfeited";

export function track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>) {
  try {
    posthog.capture(event, properties ?? undefined);
  } catch (e) {
    console.warn("Analytics capture failed:", e);
  }
}

/** Ties events to the Firebase account, so one user's timeline can be found by email. */
let signedInUid: string | null = null;
onAuthStateChanged(auth, (user) => {
  try {
    if (user) {
      signedInUid = user.uid;
      posthog.identify(user.uid, { email: user.email ?? null, name: user.displayName ?? null });
    } else if (signedInUid) {
      // Only on a real sign-out: resetting on every signed-out launch would
      // give a visitor a new id each time and break the opener funnel.
      signedInUid = null;
      posthog.reset();
    }
  } catch (e) {
    console.warn("Analytics identify failed:", e);
  }
});
