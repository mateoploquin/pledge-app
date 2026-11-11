import React, { useEffect, useRef, useState } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { fetchPaymentSheetParams } from "../../../services/stripe-api";
import { auth } from "../../../firebaseConfig";
import { CURRENCY_SYMBOL, STRIPE_MERCHANT_COUNTRY } from "../../../config";
import Callout from "../../../components/ink/callout";
import { color, cream, radius } from "../../../theme/tokens";
import { track } from "../../../services/analytics";

interface SetPaymentProps {
  paymentSetupComplete: boolean;
  setPaymentSetupComplete: (complete: boolean) => void;
  pledgeValue: number;
  durationDays: number;
  setPublishableKey: (publishableKey: string) => void;
  /** Called once the card is saved. */
  onComplete?: () => void | Promise<void>;
  /**
   * Hands the wizard "try again" while the card wasn't saved (null otherwise),
   * so "Add a card" sits in the footer as in Paper B8.
   */
  onRetryChange?: (retry: (() => void) | null) => void;
}

const describeError = (err: any) =>
  err?.response?.data?.error ?? err?.message ?? "Could not reach the server.";

/** Step: the card. Opens Stripe's sheet at once; this step has no content of its own. */
const SetPayment: React.FC<SetPaymentProps> = ({
  paymentSetupComplete,
  setPaymentSetupComplete,
  pledgeValue,
  durationDays,
  setPublishableKey,
  onComplete,
  onRetryChange,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const initializePaymentSheet = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Sign in required", "Please sign in again before adding a card.");
        return false;
      }
      const idToken = await user.getIdToken();
      const { setupIntent, ephemeralKey, customer, publishableKey } = await fetchPaymentSheetParams(idToken);
      if (publishableKey) setPublishableKey(publishableKey);

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Pledge",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
        allowsDelayedPaymentMethods: false,
        returnURL: "pledge://stripe-redirect",
        applePay: { merchantCountryCode: STRIPE_MERCHANT_COUNTRY },
        style: "alwaysDark",
        // Stripe's sheet in the app's palette (src/theme/tokens.ts).
        appearance: {
          colors: {
            primary: color.action,
            background: color.raised,
            componentBackground: color.surface,
            componentBorder: color.divider,
            componentDivider: color.divider,
            primaryText: color.text,
            secondaryText: color.textSecondary,
            placeholderText: color.textTertiary,
            icon: color.textSecondary,
            error: color.error,
          },
          shapes: { borderRadius: radius.control },
          primaryButton: {
            colors: { background: color.action, text: color.onAction },
            shapes: { borderRadius: radius.control },
          },
        },
      });
      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        Alert.alert("Card setup failed", initError.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error initializing payment sheet:", err);
      track("card_failed", { reason: "setup_unavailable" });
      Alert.alert("Card setup unavailable", describeError(err));
      return false;
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      track("card_failed", { reason: error.code });
      setDismissed(true);
      if (error.code !== "Canceled") Alert.alert(`Error code: ${error.code}`, error.message);
      return;
    }
    // Card saved. The wizard records the pledge and starts it.
    track("card_added");
    setPaymentSetupComplete(true);
    await onComplete?.();
  };

  const handleSetUpPayment = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const initialized = await initializePaymentSheet();
      if (initialized) await openPaymentSheet();
      else setDismissed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!paymentSetupComplete) handleSetUpPayment();
  }, []);

  const showRetry = dismissed && !loading && !paymentSetupComplete;
  const retry = useRef(handleSetUpPayment);
  retry.current = handleSetUpPayment;
  useEffect(() => {
    onRetryChange?.(showRetry ? () => retry.current() : null);
  }, [showRetry]);
  useEffect(() => () => onRetryChange?.(null), []);

  return (
    <View style={styles.container}>
      {loading || paymentSetupComplete ? (
        <View style={styles.working}>
          <ActivityIndicator color={cream.base} />
          <Text style={styles.text}>
            {paymentSetupComplete ? "Starting your pledge." : "Opening secure card setup."}
          </Text>
        </View>
      ) : dismissed ? (
        <Callout
            compact
          tone="error"
          title="Your card wasn't saved."
          text="Nothing was charged and your pledge hasn't started. Try again, or use another card."
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  working: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    color: cream.muted,
    fontSize: 15,
    lineHeight: 21,
    flexShrink: 1,
  },
});

export default SetPayment;
