import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pledge, PledgeSettings } from "../types";
import { CHALLENGE_DURATION } from "../screens/home/home.constants";

const PLEDGES_KEY = "pledges";
const TERMS_KEY = "termsAcceptedAt";

// Keys used by the single-pledge version of the app.
const LEGACY_SETTINGS_KEY = "pledgeSettings";
const LEGACY_START_KEY = "challengeStartDate";

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * 10 random base36 chars. Fixed length matters: the native library clears
 * stored events by key prefix, so no id may be a prefix of another.
 */
export function newPledgeId(): string {
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
  }
  return id;
}

export async function loadPledges(): Promise<Pledge[]> {
  try {
    const raw = await AsyncStorage.getItem(PLEDGES_KEY);
    const list = raw ? (JSON.parse(raw) as Pledge[]) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error("Could not read pledges:", e);
    return [];
  }
}

export async function savePledges(pledges: Pledge[]): Promise<void> {
  await AsyncStorage.setItem(PLEDGES_KEY, JSON.stringify(pledges));
}

export async function addPledge(pledge: Pledge): Promise<Pledge[]> {
  const list = (await loadPledges()).filter((p) => p.id !== pledge.id);
  list.push(pledge);
  await savePledges(list);
  return list;
}

export async function removePledge(id: string): Promise<Pledge[]> {
  const list = (await loadPledges()).filter((p) => p.id !== id);
  await savePledges(list);
  return list;
}

export async function updatePledge(id: string, patch: Partial<Pledge>): Promise<Pledge[]> {
  const list = (await loadPledges()).map((p) => (p.id === id ? { ...p, ...patch } : p));
  await savePledges(list);
  return list;
}

export async function getPledge(id: string): Promise<Pledge | undefined> {
  return (await loadPledges()).find((p) => p.id === id);
}

export const pledgeEndsAt = (p: Pledge) =>
  // Fixed N x 24h, so a DST change inside the window doesn't add or drop an hour.
  new Date(p.startedAt).getTime() + p.durationDays * 24 * 60 * 60 * 1000;

export const pledgeIsOver = (p: Pledge, now = Date.now()) => pledgeEndsAt(p) <= now;

/**
 * Converts a pledge saved by the single-pledge version of the app into an
 * entry of the list. Returns it when a conversion happened, so the caller can
 * restart its monitoring under the new name.
 */
export async function migrateLegacyPledge(): Promise<Pledge | undefined> {
  const [raw, start] = await Promise.all([
    AsyncStorage.getItem(LEGACY_SETTINGS_KEY),
    AsyncStorage.getItem(LEGACY_START_KEY),
  ]);
  if (!raw) return undefined;
  await AsyncStorage.multiRemove([LEGACY_SETTINGS_KEY, LEGACY_START_KEY]);

  const settings: PledgeSettings = JSON.parse(raw);
  if (!settings?.paymentSetupComplete || !settings.selectionEvent?.familyActivitySelection) {
    return undefined;
  }
  const pledge: Pledge = {
    id: newPledgeId(),
    selectionEvent: settings.selectionEvent,
    pledgeValue: settings.pledgeValue,
    timeValue: settings.timeValue,
    durationDays: settings.durationDays ?? CHALLENGE_DURATION,
    startedAt: start ?? new Date().toISOString(),
  };
  await addPledge(pledge);
  await markTermsAccepted();
  return pledge;
}

export async function hasAcceptedTerms(): Promise<boolean> {
  return !!(await AsyncStorage.getItem(TERMS_KEY));
}

export async function markTermsAccepted(): Promise<void> {
  await AsyncStorage.setItem(TERMS_KEY, new Date().toISOString());
}
