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
  /** ISO date the pledge started. */
  startedAt: string;
};
