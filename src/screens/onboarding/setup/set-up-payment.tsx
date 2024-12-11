// src/screens/onboarding/setup/set-up-payment.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import colors from "../../../theme/colors";
import MainButton from "../../../components/buttons/main-button";
import { useStripe } from "@stripe/stripe-react-native";
import { fetchPaymentSheetParams } from "../../../services/stripe-api";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from '../../../../firebaseConfig'; 

interface SetPaymentProps {
  isButtonDisabled: boolean;
  setIsButtonDisabled: (disabled: boolean) => void;
  paymentSetupComplete: boolean;
  setPaymentSetupComplete: (complete: boolean) => void;
    pledgeValue: number;
        setPublishableKey: (publishableKey: string) => void; // add the setPublishableKey prop

}

const SetPayment: React.FC<SetPaymentProps> = ({
    isButtonDisabled,
  setIsButtonDisabled,
  paymentSetupComplete,
  setPaymentSetupComplete,
    pledgeValue,
    setPublishableKey
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const initializePaymentSheet = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('User not authenticated. Cannot fetch payment sheet params.');
        return false;
      }

      const idToken = await user.getIdToken();
        console.log('idToken',idToken)
      const { setupIntent, ephemeralKey, customer, publishableKey , error } = await fetchPaymentSheetParams(idToken);
      if (error) {
        console.error("Error fetching payment sheet params:", error);
        return false;
      }

         if (publishableKey) {
            setPublishableKey(publishableKey);
         }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Pledge, Inc.",
          customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
          applePay: {
              merchantCountryCode: 'ES',
            },
      });

      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        return false;
      }

      // Initialization succeeded
      return true;
    } catch (err) {
      console.error("Error initializing payment sheet:", err);
      return false;
    }
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
         setPaymentSetupComplete(true)
      Alert.alert("Success", "Your payment method is successfully set up for future payments!");

    }
    setLoading(false);
  };

    const handleSetUpPayment = async () => {
        setLoading(true)
        const initialized = await initializePaymentSheet();
        setLoading(false);
        if(initialized){
             openPaymentSheet()
        }

    }

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
              onPress={handleSetUpPayment}
              text={paymentSetupComplete ? "Update Payment Method" : "Set Up Payment"}
                style={{ opacity: loading ? 0.5 : 1 }}
                disabled={loading}
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