import { z } from "zod";

import { ACCOUNT_CURRENCIES } from "@/features/accounts/account.types";
import {
  AI_CONTEXT_MODES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_TIME_ZONES,
} from "@/features/settings/settings.types";

export const profileSettingsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),
});

export const financialPreferencesSchema = z.object({
  defaultCurrency: z.enum(ACCOUNT_CURRENCIES),

  timezone: z.enum(SUPPORTED_TIME_ZONES),

  dateFormat: z.enum(SUPPORTED_DATE_FORMATS),
});

export const aiPreferencesSchema = z.object({
  aiEnabled: z.boolean(),

  aiContextMode: z.enum(AI_CONTEXT_MODES),
});

export const deleteTransactionsSchema = z.object({
  confirmation: z.literal("DELETE TRANSACTIONS", {
    message: 'Enter "DELETE TRANSACTIONS" exactly.',
  }),
});

export const resetFinancialDataSchema = z.object({
  confirmation: z.literal("RESET FINSIGHT", {
    message: 'Enter "RESET FINSIGHT" exactly.',
  }),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT", {
    message: 'Enter "DELETE MY ACCOUNT" exactly.',
  }),

  currentPassword: z.string().max(500).optional(),
});
