import React, { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsButtonDisabled(!paymentSetupComplete);
  }, [paymentSetupComplete, setIsButtonDisabled]);

  return (
    <View>
      <Text style={styles.title}>Put your card down</Text>
      <Text style={styles.subtitle}>
        Nothing is charged now. You only pay your {CURRENCY_SYMBOL}
        {pledgeValue} pledge if you unlock your apps before the 30 days are up.
      </Text>
      <View style={styles.buttonRow}>
        <MainButton
          onPress={handleSetUpPayment}
          text={paymentSetupComplete ? "Update Payment Method" : "Set Up Payment"}
          style={{ opacity: loading ? 0.5 : 1 }}
          disabled={loading}
        />
        {paymentSetupComplete && (
          <Text style={styles.success}>
            We've received your payment method. You're all set!
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    marginHorizontal: 21,
    color: colors.orange,
    marginTop: 50,
    fontSize: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  subtitle: {
    marginHorizontal: 40,
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
    color: colors.black,
  },
  buttonRow: {
    marginVertical: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  success: {
    color: colors.orange,
    textAlign: "center",
    marginTop: 50,
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 60,
  },
});

export default SetPayment;
