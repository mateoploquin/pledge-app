import React, { useState, useEffect } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { CardField, useConfirmPayment, useStripe } from '@stripe/stripe-react-native';

export default function CheckoutScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`/payment-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { setupIntent, ephemeralKey, customer } = await response.json();

    return {
      setupIntent,
      ephemeralKey,
      customer,
    };
  };

  const initializePaymentSheet = async () => {
    const { setupIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();

    const { error } = await initPaymentSheet({
      merchantDisplayName: "Example, Inc.",
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      setupIntentClientSecret: setupIntent,
    });
    if (!error) {
      setLoading(true);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert('Success', 'Your payment method is successfully set up for future payments!');
    }
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  return (
    <View>
      <Button
        disabled={!loading}
        title="Set up"
        onPress={openPaymentSheet}
      />
    </View>
  );
}

// const PaymentScreen = () => {
//     const [cardDetails, setCardDetails] = useState();
//     const { confirmPayment, loading } = useConfirmPayment();
  
//     const handlePayPress = async () => {
//       // Assume you have a server endpoint to create PaymentIntent
//       const { clientSecret, error } = await fetchPaymentIntentClientSecret();
  
//       if (error) {
//         alert(`Payment failed: ${error.message}`);
//         return;
//       }
  
//       const { paymentIntent, error: confirmError } = await confirmPayment(clientSecret, {
//         type: 'Card',
//         billingDetails: { email: 'email@example.com' }, // Add user billing details if needed
//       });
  
//       if (confirmError) {
//         alert(`Payment failed: ${confirmError.message}`);
//       } else if (paymentIntent) {
//         alert('Payment successful!');
//       }
//     };
  
//     return (
//       <View>
//         <CardField
//           postalCodeEnabled={true}
//           placeholder={{ number: '4242 4242 4242 4242' }}
//           onCardChange={(cardDetails) => setCardDetails(cardDetails)}
//           cardStyle={{ backgroundColor: '#FFFFFF', textColor: '#000000' }}
//           style={{ width: '100%', height: 50, marginVertical: 30 }}
//         />
//         <Button onPress={handlePayPress} title="Complete Payment" disabled={loading} />
//       </View>
//     );
// };

// export default PaymentScreen;

