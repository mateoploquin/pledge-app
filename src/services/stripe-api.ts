// src/services/stripe-api.ts
const API_URL = 'https://6adc-88-1-22-55.ngrok-free.app/stripe/payment-sheet'; // Replace with your server's URL

export const fetchPaymentSheetParams = async (idToken: string) => {
  try {
    const response = await fetch(`${API_URL}/payment-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const { setupIntent, ephemeralKey, customer, publishableKey } =
      await response.json();
    return { setupIntent, ephemeralKey, customer, publishableKey };
  } catch (error) {
    console.error('Error fetching payment sheet params:', error);
    return { error };
  }
};