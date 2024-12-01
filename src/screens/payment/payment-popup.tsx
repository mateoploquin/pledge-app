import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import {
  useStripe,
  CardForm,
  isPlatformPaySupported,
  PlatformPayButton,
  PlatformPay
} from '@stripe/stripe-react-native';
import MainButton from '../../components/buttons/main-button';

const PaymentPopup = ({ isVisible, onClose, onPaymentSuccess }) => {
  const stripe = useStripe();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [loading, setLoading] = useState(false);
  const mockMode = true; // Toggle mock mode for testing

  const [pledgePrice, setPledgePrice] = useState(10);
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);

  const API_URL = "https://api.stripe.com/v1";

  const animatePopup = (visible) => {
    const toValue = visible ? 0 : Dimensions.get('window').height;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!visible) onClose(); // Close the modal after animation ends
    });
  };

  useEffect(() => {
    animatePopup(isVisible);
  }, [isVisible]);

  useEffect(() => {
    (async function () {
      setIsApplePaySupported(await isPlatformPaySupported());
    })();
  }, []);

  const fetchPaymentIntentClientSecret = async () => {
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: pledgePrice, // Make sure this is set to your actual amount
        currency: 'eur',
      }),
    });
    const { clientSecret } = await response.json();
    return clientSecret;
  };

  const handleApplePayPress = async () => {
    try {
      const clientSecret = await fetchPaymentIntentClientSecret();
      
      const { error } = await stripe.confirmPlatformPayPayment(
        clientSecret,
        {
          applePay: {
            cartItems: [
              {
                label: 'Your Pledge',
                amount: pledgePrice.toString(),
                paymentType: PlatformPay.PaymentType.Immediate,
              }
            ],
            merchantCountryCode: 'ES',
            currencyCode: 'EUR',
            requiredBillingContactFields: [
              PlatformPay.ContactField.PhoneNumber,
              PlatformPay.ContactField.EmailAddress,
            ],
          },
        }
      );

      if (error) {
        console.error('Payment failed:', error);
      } else {
        console.log('Payment successful!');
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Error during Apple Pay:', error);
    }
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    if (mockMode) {
      console.log("Mock: Opening Payment Sheet...");
      const success = true; // Simulated result
      if (success) {
        console.log("Mock: Payment completed successfully!");
        onPaymentSuccess();
      } else {
        console.error("Mock: Payment failed!");
      }
      setLoading(false);
      return;
    }

    try {
      const { error } = await stripe.presentPaymentSheet();
      if (error) {
        console.error("Error opening payment sheet:", error);
      } else {
        onPaymentSuccess();
      }
    } catch (error) {
      console.error("Error during payment sheet interaction:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={onClose}
      animationType="none"
    >
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.overlayTouch} onPress={() => animatePopup(false)} />
        </Animated.View>

        <Animated.View style={[styles.popup, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Set Up Payment Method</Text>
            <TouchableOpacity onPress={() => animatePopup(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {isApplePaySupported && (
            <PlatformPayButton
              onPress={handleApplePayPress}
              type={PlatformPay.ButtonType.Order}
              appearance={PlatformPay.ButtonStyle.Black}
              borderRadius={4}
              style={{
                width: '100%',
                height: 50,
              }}
            />
          )}

          <View style={styles.content}>
            <Text style={styles.description}>Please enter your payment details below:</Text>
            <Text style={styles.priceText}>Price: {pledgePrice} €</Text>
            <View style={styles.cardFormContainer}>
              <CardForm
                style={styles.cardForm}
                onFormComplete={(cardDetails) => {
                  console.log("Card details entered:", cardDetails);
                }}
              />
            </View>
          </View>

          

          <View style={styles.content}>
            <MainButton
              onPress={openPaymentSheet}
              text="Submit"
              style={[{ opacity: loading ? 0.5 : 1 }]}
              disabled={loading}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouch: {
    flex: 1,
  },
  popup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.75,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: '#ff6600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  cardFormContainer: {
    width: '100%',
    marginBottom: 20,
  },
  cardForm: {
    width: '100%',
    height: 200,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
});

export default PaymentPopup;
