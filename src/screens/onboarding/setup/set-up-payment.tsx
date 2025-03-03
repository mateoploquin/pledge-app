import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import colors from "../../../theme/colors";
import MainButton from "../../../components/buttons/main-button";
import { useStripe, isPlatformPaySupported } from "@stripe/stripe-react-native";
import { fetchPaymentSheetParams } from "../../../services/stripe-api";
import { auth } from '../../../../firebaseConfig';
import { sendPledgeData } from "../../../services/sendPledgeData";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SetPaymentProps {
  isButtonDisabled: boolean;
  setIsButtonDisabled: (disabled: boolean) => void;
  paymentSetupComplete: boolean;
  setPaymentSetupComplete: (complete: boolean) => void;
  pledgeValue: number;
  timeValue: number;
  setPublishableKey: (publishableKey: string) => void;
}

const SetPayment: React.FC<SetPaymentProps> = ({
  isButtonDisabled,
  setIsButtonDisabled,
  paymentSetupComplete,
  setPaymentSetupComplete,
  pledgeValue,
  timeValue,
  setPublishableKey,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);

  useEffect(() => {
    const checkApplePaySupport = async () => {
      const isSupported = await isPlatformPaySupported();
      setIsApplePaySupported(isSupported);
    };
    checkApplePaySupport();
  }, []);

  const initializePaymentSheet = async (): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("User not authenticated. Cannot fetch payment sheet params.");
        return false;
      }

      const idToken = await user.getIdToken();
      const { setupIntent, ephemeralKey, customer, publishableKey, error } =
        await fetchPaymentSheetParams(idToken);
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
          merchantCountryCode: "ES",
        },
      });

      if (initError) {
        console.error("Error initializing payment sheet:", initError);
        return false;
      }

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
      setLoading(false);
    } else {
      setPaymentSetupComplete(true);
      Alert.alert(
        "Success",
        "Your payment method is successfully set up for future payments!"
      );

      // Send pledge data after successful payment setup
      const user = auth.currentUser;
      if (user) {
        try {
          const idToken = await user.getIdToken();
          await sendPledgeData({ pledgeValue, timeValue }, idToken);
          
          // Set the challenge start date
          const startDate = new Date().toISOString();
          await AsyncStorage.setItem('challengeStartDate', startDate);
          
          console.log("Pledge data and challenge start date set successfully");
        } catch (err) {
          console.error("Error sending pledge data:", err);
        }
      }

      setLoading(false);
    }
  };

  const handleSetUpPayment = async () => {
    setLoading(true);
    const initialized = await initializePaymentSheet();
    setLoading(false);
    if (initialized) {
      openPaymentSheet();
    }
  };

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
        Select a Payment Method
      </Text>

      <View style={{ marginVertical: 20, paddingVertical: 10 }}>
        {isApplePaySupported && (
          <MainButton
            onPress={handleSetUpPayment}
            text={paymentSetupComplete ? "Update Payment Method" : "Set Up Payment"}
            style={{ opacity: loading ? 0.5 : 1 }}
            disabled={loading}
          />
        )}
        {paymentSetupComplete && (
          <Text
            style={{
              color: colors.orange,
              textAlign: "center",
              marginTop: 50,
              fontSize: 20,
              fontWeight: "600",
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
