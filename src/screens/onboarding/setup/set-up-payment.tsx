import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import colors from "../../../theme/colors";
import MainButton from "../../../components/buttons/main-button";
import { useStripe } from "@stripe/stripe-react-native";
import { fetchPaymentSheetParams } from "../../../services/stripe-api";

interface SetPaymentProps {
  isButtonDisabled: boolean;
  setIsButtonDisabled: (disabled: boolean) => void;
  paymentSetupComplete: boolean;
  setPaymentSetupComplete: (complete: boolean) => void;
}

const SetPayment: React.FC<SetPaymentProps> = ({
  isButtonDisabled,
  setIsButtonDisabled,
  paymentSetupComplete,
  setPaymentSetupComplete
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const initializePaymentSheet = async () => {
    try {
      const { setupIntent, ephemeralKey, customer, error } = await fetchPaymentSheetParams();
      if (error) {
        console.error("Error fetching payment sheet params:", error);
        return;
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Example, Inc.",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
      });

      if (!initError) {
        setLoading(true);
      } else {
        console.error("Error initializing payment sheet:", initError);
      }
    } catch (err) {
      console.error("Error initializing payment sheet:", err);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert("Success", "Your payment method is successfully set up for future payments!");
      setPaymentSetupComplete(true);
    }
  };

  useEffect(() => {
    // Initialize the PaymentSheet when the component mounts
    initializePaymentSheet();
  }, []);

  useEffect(() => {
    setIsButtonDisabled(!paymentSetupComplete);
  }, [paymentSetupComplete, setIsButtonDisabled]);

  return (
    <View>
      <Text
        style={{
          marginHorizontal: 21,
          color: colors.orange,
          marginTop: 50,
          fontSize: 24,
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        Set Up Your Payment
      </Text>

      <View style={{ marginVertical: 20, paddingVertical: 10 }}>
        <MainButton
          onPress={openPaymentSheet}
          text={paymentSetupComplete ? "Update Payment Method" : "Set Up Payment"}
          style={{ opacity: loading ? 1 : 0.5 }}
          disabled={!loading}
        />
        {paymentSetupComplete && (
          <Text
            style={{
              color: colors.orange,
              textAlign: 'center',
              marginTop: 50,
              fontSize: 20,
              fontWeight: '600',
              paddingHorizontal: 100,
            }}
          >
            We've received your payment method. You're all set!
          </Text>
        )}
      </View>
    </View>
  );
};

export default SetPayment;
