import { SelectionInfo } from "./selectionInfo";

/** One active pledge. Several can run at the same time, each with its own apps. */
export type Pledge = {
  /** Short alphanumeric id, also used to name the Screen Time schedule. */
  id: string;
  selectionEvent: SelectionInfo;
  /** Money at stake. */
  pledgeValue: number;
  /** Daily allowance in minutes; 0 blocks the apps for the whole pledge. */
  timeValue: number;
  durationDays: number;
  /** What the time is for, in the person's words (optional; the coach reads it). */
  purpose?: string;
  /** ISO date the pledge started. */
  startedAt: string;
  /** True once the backend knows about it (needed to charge it). */
  synced?: boolean;
  /** When the last paid break started (ISO). */
  breakStartedAt?: string;
  /** Paid breaks taken on `breaksDay` (the phone's local date, YYYY-MM-DD). */
  breaksDay?: string;
  breaksToday?: number;
};
