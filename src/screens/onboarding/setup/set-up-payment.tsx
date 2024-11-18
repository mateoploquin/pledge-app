import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import {
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "../../../utils/constants/dimensions";
import colors from "../../../theme/colors";
import MainButton from "../../../components/buttons/main-button";
import PaymentPopup from "../../payment/payment-popup";


interface SetPaymentProps {
  isButtonDisabled: Boolean;
  setIsButtonDisabled: (disabled: Boolean) => void;
  paymentSetupComplete: Boolean;
  setPaymentSetupComplete: (complete: Boolean) => void;
}

const SetPayment: React.FC<SetPaymentProps> = ({
  isButtonDisabled,
  setIsButtonDisabled,
  paymentSetupComplete,
  setPaymentSetupComplete
}) => {
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  // Update parent's button disabled state when component mounts
  useEffect(() => {
    setIsButtonDisabled(!paymentSetupComplete);
  }, [paymentSetupComplete]);

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

      <View 
        style={{ 
            marginVertical: 20,
            paddingVertical: 10,
        }}>
        <MainButton
          onPress={() => setShowPaymentPopup(true)}
          text={paymentSetupComplete ? "Update Payment Method" : "Set Up Payment"}
        />
        {paymentSetupComplete && (
          <Text style={{
            color: colors.orange,
            textAlign: 'center',
            marginTop: 50,
            fontSize: 20,
            fontWeight: '600',
            paddingHorizontal: 100,
          }}>
            We've received your payment method. You're all set!
          </Text>
        )}
      </View>

      <PaymentPopup
        isVisible={showPaymentPopup}
        onClose={() => setShowPaymentPopup(false)}
        onPaymentSuccess={() => {
          setPaymentSetupComplete(true);
          setShowPaymentPopup(false);
        }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SetPayment;
