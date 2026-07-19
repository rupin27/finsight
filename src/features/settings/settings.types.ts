import type { AccountCurrency } from "@/features/accounts/account.types";

export const SUPPORTED_TIME_ZONES = [
  "UTC",
  "Asia/Kolkata",
  "Europe/Dublin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
] as const;

export const SUPPORTED_DATE_FORMATS = [
  "MMM d, yyyy",
  "d MMM yyyy",
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "yyyy-MM-dd",
] as const;

export const AI_CONTEXT_MODES = ["aggregated", "disabled"] as const;

export type SupportedTimeZone = (typeof SUPPORTED_TIME_ZONES)[number];

export type SupportedDateFormat = (typeof SUPPORTED_DATE_FORMATS)[number];

export type AiContextMode = (typeof AI_CONTEXT_MODES)[number];

export interface UserPreferences {
  fullName: string | null;

  defaultCurrency: AccountCurrency;

  timezone: SupportedTimeZone;

  dateFormat: SupportedDateFormat;

  aiEnabled: boolean;

  aiContextMode: AiContextMode;
}

export interface AiUsageEvent {
  id: string;

  model: string;

  status: "started" | "completed" | "failed";

  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;

  promptCharacters: number;
  responseCharacters: number;

  errorCode: string | null;

  createdAt: string;
}

export interface UserDataCounts {
  accounts: number;
  transactions: number;
  loanProfiles: number;
  financialGoals: number;
  aiRequests: number;
}

export interface SettingsPageData {
  email: string;
  userId: string;

  accountCreatedAt: string | null;

  lastSignInAt: string | null;

  authProviders: string[];
  usesPasswordAuthentication: boolean;

  preferences: UserPreferences;

  aiUsage: AiUsageEvent[];

  aiRequestsLast24Hours: number;

  aiDailyLimit: number;

  dataCounts: UserDataCounts;
}
