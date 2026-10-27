import axios from "axios";
import { API_URL } from "../config";

const STRIPE_URL = `${API_URL}/stripe`;

const authHeaders = (idToken: string) => ({
  Authorization: `Bearer ${idToken}`,
});

export const fetchPublishableKey = async (): Promise<string> => {
  const { data } = await axios.get<{ publishableKey: string }>(
    `${STRIPE_URL}/publishable-key`
  );
  return data.publishableKey;
};

export type PaymentSheetParams = {
  setupIntent: string;
  ephemeralKey: string;
  customer: string;
  publishableKey: string;
};

export const fetchPaymentSheetParams = async (
  idToken: string
): Promise<PaymentSheetParams & { error?: undefined }> => {
  const { data } = await axios.post<PaymentSheetParams>(
    `${STRIPE_URL}/payment-sheet`,
    {},
    { headers: authHeaders(idToken) }
  );
  return data;
};

export type ChargeResult = {
  status?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
};

/** Charges the user's saved card for one pledge's amount. */
export async function chargePledge(idToken: string, pledgeId: string): Promise<ChargeResult> {
  const { data } = await axios.post<ChargeResult>(
    `${STRIPE_URL}/charge`,
    { pledgeId },
    { headers: authHeaders(idToken) }
  );
  return data;
}

/** Whether the user already has a card on file, so the card step can be skipped. */
export async function fetchHasCard(idToken: string): Promise<boolean> {
  const { data } = await axios.get<{ hasCard: boolean }>(`${STRIPE_URL}/payment-method`, {
    headers: authHeaders(idToken),
  });
  return !!data.hasCard;
}
