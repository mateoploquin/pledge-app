import { CURRENCY_SYMBOL } from "../../config";

/**
 * The deal, told after sign-in and the welcome (see onboarding.tsx): four
 * beats, each one line and a small glass card of plain figures. The v1 ring
 * figures became plain numbers in the v2 design. Nothing to tap; a tap
 * skips to the next beat.
 */

/** How long each beat holds before the next one. */
export const BEAT_MS = 3400;

export interface DealBeat {
  line: string;
  /** Label and value rows on the beat's glass card. */
  rows: [string, string][];
}

export const DEAL_BEATS: DealBeat[] = [
  { line: "Pick your\napps.", rows: [["Your apps", "Instagram, TikTok"]] },
  {
    line: "Set a limit.\nPut money\non it.",
    rows: [
      ["Daily limit", "30 min"],
      ["Your pledge", `${CURRENCY_SYMBOL}10`],
    ],
  },
  { line: "Hit it, and\nthey lock.", rows: [["30 of 30 min", "Locked until midnight"]] },
  { line: "Unlock early?\nYou lose it.", rows: [["Unlock early", `${CURRENCY_SYMBOL}10 charged`]] },
];
