import { z } from "zod";

import {
  ACCOUNT_COUNTRIES,
  ACCOUNT_CURRENCIES,
  ACCOUNT_TYPES,
} from "@/features/accounts/account.types";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime());
  }, "Enter a valid date.");

export const accountFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Account name must contain at least 2 characters.")
      .max(80, "Account name cannot exceed 80 characters."),

    institution: z
      .string()
      .trim()
      .max(100, "Institution cannot exceed 100 characters."),

    accountType: z.enum(ACCOUNT_TYPES, {
      message: "Select a valid account type.",
    }),

    country: z.enum(ACCOUNT_COUNTRIES, {
      message: "Select a valid country.",
    }),

    currency: z.enum(ACCOUNT_CURRENCIES, {
      message: "Select a valid currency.",
    }),

    openingBalance: z.coerce
      .number({
        message: "Enter a valid balance.",
      })
      .finite("Enter a valid balance.")
      .min(-1_000_000_000_000, "The balance is too small.")
      .max(1_000_000_000_000, "The balance is too large."),

    openingBalanceDate: isoDateSchema,
  })
  .superRefine((data, context) => {
    if (data.accountType === "loan" && data.openingBalance < 0) {
      context.addIssue({
        code: "custom",
        path: ["openingBalance"],
        message: "Enter the loan amount owed as a positive number.",
      });
    }
  });

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export type AccountFormField = keyof AccountFormValues;

export type AccountFieldErrors = Partial<Record<AccountFormField, string[]>>;
