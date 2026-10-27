import axios from "axios";
import { API_URL } from "../config";

interface PledgeData {
  id: string;
  pledgeValue: number;
  timeValue: number;
  durationDays: number;
}

const authHeaders = (idToken: string) => ({ Authorization: `Bearer ${idToken}` });

/** Records a new pledge on the backend so it knows what to charge on surrender. */
export async function sendPledgeData(data: PledgeData, idToken: string) {
  const response = await axios.post(`${API_URL}/pledge`, data, { headers: authHeaders(idToken) });
  return response.data;
}

/** Marks a pledge as completed without a charge. Best effort. */
export async function completePledge(id: string, idToken: string) {
  const response = await axios.post(`${API_URL}/pledge/${id}/complete`, {}, {
    headers: authHeaders(idToken),
  });
  return response.data;
}
