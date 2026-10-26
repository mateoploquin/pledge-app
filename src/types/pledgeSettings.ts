import { SelectionInfo } from './selectionInfo';

export type PledgeSettings = {
	selectionEvent: SelectionInfo;
	pledgeValue: number;
	timeValue: number;
	/** Length of the pledge in days. Older saves have none: treat as 30. */
	durationDays?: number;
	paymentSetupComplete?: boolean;
}