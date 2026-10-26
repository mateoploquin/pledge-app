import axios from "axios";
import { API_URL } from "../config";

interface PledgeData {
  pledgeValue: number;
  timeValue: number;
  durationDays: number;
}

export async function sendPledgeData(data: PledgeData, idToken: string) {
  const response = await axios.post(`${API_URL}/pledge`, data, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return response.data;
}
