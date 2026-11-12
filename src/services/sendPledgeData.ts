import axios from "axios";
import { API_URL } from "../config";
import { auth } from "../firebaseConfig";
import { Pledge } from "../types";
import { updatePledge } from "./pledges";

interface PledgeData {
  id: string;
  pledgeValue: number;
  timeValue: number;
  durationDays: number;
  /** What the time is for; optional. */
  purpose?: string;
  /** ISO date; lets a pledge created earlier (migrated) keep its real end date. */
  startedAt?: string;
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

/** An ID token, after making sure the backend knows this pledge (needed to charge it). */
export async function syncedIdToken(pledge: Pledge): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("You are signed out. Sign in again to pay.");
  const idToken = await user.getIdToken();
  if (!pledge.synced) {
    // Carried over from the old build: the backend must know it before it can charge it.
    await sendPledgeData(
      {
        id: pledge.id,
        pledgeValue: pledge.pledgeValue,
        timeValue: pledge.timeValue,
        durationDays: pledge.durationDays,
        startedAt: pledge.startedAt,
      },
      idToken
    );
    await updatePledge(pledge.id, { synced: true });
  }
  return idToken;
}
