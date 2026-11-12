import axios from "axios";
import { API_URL } from "../config";
import { auth } from "../firebaseConfig";

/** Why the coach was opened; it shapes how the coach starts. */
export type CoachContext = "home" | "limit" | "pledge_started";

export type CoachMessage = { role: "user" | "assistant"; text: string; createdAt: string };

const headers = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to talk to your coach.");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
};

/** The backend's one-sentence error, or a plain fallback. */
export const coachError = (e: any): string =>
  e?.response?.data?.error ?? "Your coach couldn't answer just now. Try again in a minute.";

export async function fetchCoachMessages(): Promise<CoachMessage[]> {
  const { data } = await axios.get(`${API_URL}/coach/messages`, { headers: await headers() });
  return data?.messages ?? [];
}

/** Sends a message (or, with empty text, opens at a moment) and returns the reply. */
export async function sendCoachMessage(text: string, context: CoachContext = "home"): Promise<CoachMessage> {
  const { data } = await axios.post(
    `${API_URL}/coach/message`,
    { text, context },
    { headers: await headers(), timeout: 90_000 }
  );
  return data.reply;
}
