import axios from "axios";
import { signOut as firebaseSignOut } from "firebase/auth";
import { API_URL } from "../config";
import { auth } from "../firebaseConfig";
import { loadPledges, savePledges } from "./pledges";
import { reassertBlocks, stopPledgeMonitoring } from "../screens/home/home.controller";

/** Calls for the Account screens. Every call needs the signed-in user. */
const headers = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("You are signed out.");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
};

export type Card = { brand: string; last4: string };

/** "Visa 4242", or null when no card is saved. */
export async function fetchCard(): Promise<Card | null> {
  const { data } = await axios.get<{ card: Card | null }>(`${API_URL}/stripe/payment-method`, {
    headers: await headers(),
  });
  return data.card ?? null;
}

export type Charge = {
  id: string;
  kind: "pledge" | "break";
  /** Cents. */
  amount: number;
  currency: string;
  pledgeId?: string;
  createdAt: string;
};

export async function fetchCharges(): Promise<Charge[]> {
  const { data } = await axios.get<{ charges: Charge[] }>(`${API_URL}/charges`, { headers: await headers() });
  return data.charges;
}

export type PastPledge = {
  id: string;
  pledgeValue: number;
  durationDays: number;
  status: "active" | "surrendered" | "completed" | "forfeited";
  createdAt: string;
  endsAt: string;
  completedAt?: string;
  chargedAt?: string;
};

/** Every pledge on the account, newest first; Account shows the ended ones. */
export async function fetchAllPledges(): Promise<PastPledge[]> {
  const { data } = await axios.get<{ pledges: PastPledge[] }>(`${API_URL}/pledges?status=all`, {
    headers: await headers(),
  });
  return data.pledges;
}

/** Stops every pledge on this phone: Screen Time schedules and local storage. */
async function clearLocalPledges() {
  const pledges = await loadPledges().catch(() => []);
  pledges.forEach((p) => stopPledgeMonitoring(p.id));
  await savePledges([]);
  reassertBlocks([]);
}

/**
 * Deletes the account. With pledges running, `charge` must be true: the
 * backend charges them first, the same as giving up, then deletes.
 */
export async function deleteAccount(charge: boolean): Promise<void> {
  await axios.delete(`${API_URL}/account${charge ? "?charge=1" : ""}`, { headers: await headers() });
  await clearLocalPledges();
  await firebaseSignOut(auth).catch(() => {});
}

/** Signs out. Only offered when no pledge runs (Account blocks it otherwise). */
export async function signOut(): Promise<void> {
  await clearLocalPledges();
  await firebaseSignOut(auth);
}
