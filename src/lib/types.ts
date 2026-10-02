export type ThemePref = "dark" | "light";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  dailyGoalMl: number;
  glassSizeMl: number;
  reminderIntervalMins: number;
  reminderStart: string; // "HH:MM"
  reminderEnd: string; // "HH:MM"
  notificationsEnabled: boolean;
  theme: ThemePref | string;
  avatarTheme: string;
  createdAt: string;
}

export interface WaterEntry {
  id: string;
  amountMl: number;
  createdAt: string; // ISO
}

export type ViewId =
  | "dashboard"
  | "history"
  | "stats"
  | "reminders"
  | "achievements"
  | "profile";

export interface ToastItem {
  id: number;
  title: string;
  body?: string;
  icon?: string; // lucide icon key
  variant?: "default" | "success" | "error" | "water";
}
