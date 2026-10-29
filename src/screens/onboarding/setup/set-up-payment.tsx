import React, { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { fetchPaymentSheetParams } from "../../../services/stripe-api";
import { auth } from "../../../firebaseConfig";
import { CURRENCY_SYMBOL, STRIPE_MERCHANT_COUNTRY } from "../../../config";
import PillButton from "../../../components/ink/pill-button";
import { cream } from "../../../theme/tokens";

interface SetPaymentProps {
  setIsButtonDisabled: (disabled: boolean) => void;
  paymentSetupComplete: boolean;
  setPaymentSetupComplete: (complete: boolean) => void;
  pledgeValue: number;
  durationDays: number;
  setPublishableKey: (publishableKey: string) => void;
  /** Called once the card is saved. */
  onComplete?: () => void | Promise<void>;
}

const describeError = (err: any) =>
  err?.response?.data?.error ?? err?.message ?? "Could not reach the server.";

/** Step: the card. Opens Stripe's sheet at once; this step has no content of its own. */
const SetPayment: React.FC<SetPaymentProps> = ({
  setIsButtonDisabled,
  paymentSetupComplete,
  setPaymentSetupComplete,
  pledgeValue,
  durationDays,
  setPublishableKey,
  onComplete,
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
      });
      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        Alert.alert("Card setup failed", initError.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error initializing payment sheet:", err);
      Alert.alert("Card setup unavailable", describeError(err));
      return false;
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      setDismissed(true);
      if (error.code !== "Canceled") Alert.alert(`Error code: ${error.code}`, error.message);
      return;
    }
    // Card saved. The wizard records the pledge and starts it.
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
    setIsButtonDisabled(!paymentSetupComplete);
  }, [paymentSetupComplete, setIsButtonDisabled]);

  useEffect(() => {
    if (!paymentSetupComplete) handleSetUpPayment();
  }, []);

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
        <>
          <Text style={styles.text}>
            Nothing is charged now. You only pay your {CURRENCY_SYMBOL}
            {pledgeValue} pledge if you unlock your apps, delete Pledge or turn off Screen Time access
            before the {durationDays} days are up.
          </Text>
          <PillButton text="Add a card" onPress={handleSetUpPayment} style={styles.button} />
        </>
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
  button: {
    marginTop: 4,
  },
});

export default SetPayment;
