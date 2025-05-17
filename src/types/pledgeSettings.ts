import { SelectionInfo } from './selectionInfo';
import { FocusTimeSlot } from './focusTime';

export type PledgeSettings = {
	selectionEvent: SelectionInfo;
	pledgeValue: number;
	focusTimes: FocusTimeSlot[];
	paymentSetupComplete?: boolean;
	termsAccepted?: boolean;
}