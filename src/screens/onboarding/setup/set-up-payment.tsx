import React, { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator } from "react-native";
import colors from "../../../theme/colors";
import MainButton from "../../../components/buttons/main-button";
import { useStripe } from "@stripe/stripe-react-native";
import { fetchPaymentSheetParams } from "../../../services/stripe-api";
import { auth } from "../../../firebaseConfig";
import { sendPledgeData } from "../../../services/sendPledgeData";
import { CURRENCY_SYMBOL, STRIPE_MERCHANT_COUNTRY } from "../../../config";

interface SetPaymentProps {
  setIsButtonDisabled: (disabled: boolean) => void;
  paymentSetupComplete: boolean;
  setPaymentSetupComplete: (complete: boolean) => void;
  pledgeValue: number;
  timeValue: number;
  setPublishableKey: (publishableKey: string) => void;
  /** Called once the card is saved and the pledge recorded. */
  onComplete?: () => void | Promise<void>;
}

const describeError = (err: any) =>
  err?.response?.data?.error ?? err?.message ?? "Could not reach the server.";

const SetPayment: React.FC<SetPaymentProps> = ({
  setIsButtonDisabled,
  paymentSetupComplete,
  setPaymentSetupComplete,
  pledgeValue,
  timeValue,
  setPublishableKey,
  onComplete,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const initializePaymentSheet = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Sign in required", "Please log in again before adding a card.");
        return false;
      }

      const idToken = await user.getIdToken();
      const { setupIntent, ephemeralKey, customer, publishableKey } =
        await fetchPaymentSheetParams(idToken);

      if (publishableKey) {
        setPublishableKey(publishableKey);
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Pledge",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
        allowsDelayedPaymentMethods: false,
        returnURL: "pledge://stripe-redirect",
        applePay: {
          merchantCountryCode: STRIPE_MERCHANT_COUNTRY,
        },
      });

      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        Alert.alert("Payment setup failed", initError.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error initializing payment sheet:", err);
      Alert.alert("Payment setup unavailable", describeError(err));
      return false;
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      setDismissed(true);
      if (error.code !== "Canceled") {
        Alert.alert(`Error code: ${error.code}`, error.message);
      }
      return;
    }

    // Card saved. Now record the pledge on the backend so it knows what to charge.
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Signed out");
      const idToken = await user.getIdToken();
      await sendPledgeData({ pledgeValue, timeValue }, idToken);
      setPaymentSetupComplete(true);
      await onComplete?.();
    } catch (err) {
      console.error("Error sending pledge data:", err);
      Alert.alert(
        "Could not save your pledge",
        `Your card is saved but the pledge was not recorded. Please try again.\n\n${describeError(err)}`
      );
    }
  };

  const handleSetUpPayment = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const initialized = await initializePaymentSheet();
      if (initialized) {
        await openPaymentSheet();
      } else {
        setDismissed(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsButtonDisabled(!paymentSetupComplete);
  }, [paymentSetupComplete, setIsButtonDisabled]);

  // Open the card sheet immediately; this step has no content of its own.
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!paymentSetupComplete) handleSetUpPayment();
  }, []);

  return (
    <View style={styles.container}>
      {loading || paymentSetupComplete ? (
        <>
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.subtitle}>
            {paymentSetupComplete ? "Starting your challenge…" : "Opening secure card setup…"}
          </Text>
        </>
      ) : dismissed ? (
        <>
          <Text style={styles.title}>Put your card down</Text>
          <Text style={styles.subtitle}>
            Nothing is charged now. You only pay your {CURRENCY_SYMBOL}
            {pledgeValue} pledge if you unlock your apps before the 30 days are up.
          </Text>
          <MainButton onPress={handleSetUpPayment} text="Add a card" style={styles.button} />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 120,
  },
  title: {
    color: colors.orange,
    fontSize: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 14,
    fontSize: 15,
    textAlign: "center",
    color: colors.black,
  },
  button: {
    marginTop: 28,
  },
});

export default SetPayment;
