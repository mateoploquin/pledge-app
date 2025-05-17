export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface FocusTimeSlot {
  id: string; // To uniquely identify slots for list rendering and management
  days: DayOfWeek[];
  startTime: { hour: number; minute: number };
  endTime: { hour: number; minute: number };
} 