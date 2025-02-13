// src/services/stripe-api.ts
import axios from 'axios';

const API_URL = 'https://dragon-vocal-magpie.ngrok-free.app/stripe'; // Replace with your server's URL


export const fetchPublishableKey = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_URL}/publishable-key`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.publishableKey;
  } catch (error) {
    console.error('Error fetching publishable key:', error);
    throw error;
  }
};

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

export async function sendPayment(signal: 'charge', idToken: string) {
  try {
    console.log('Sending pledge data:', signal); // Log the request payload
    const response = await axios.post(`${API_URL}/charge`, {signal}, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error sending pledge data:', error);
    if (error.response) {
      console.error('Server response:', error.response.data); // Log the server response
    }
    throw error;
  }
}