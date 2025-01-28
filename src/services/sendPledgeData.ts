// services/sendPledgeData.ts
import axios from 'axios';

interface PledgeData {
  pledgeValue: number;
  timeValue: number;
  // selectedApps: string[];
}

export async function sendPledgeData(data: PledgeData, idToken: string) {
  try {
    console.log('Sending pledge data:', data); // Log the request payload
    const response = await axios.post('https://b033-88-1-22-55.ngrok-free.app/pledge', data, {
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
