import { z } from "zod";

import {
  RECURRENCE_FREQUENCIES,
  TRANSACTION_KINDS,
} from "@/features/transactions/transaction.types";

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

const optionalUuidSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return value;
}, z.string().uuid().nullable());

const optionalDateSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return value;
}, z.string().refine(isValidIsoDate, "Enter a valid date.").nullable());

const optionalRecurrenceFrequencySchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return value;
}, z.enum(RECURRENCE_FREQUENCIES).nullable());

export const transactionFormSchema = z
  .object({
    accountId: z.string().uuid("Select a valid account."),

    destinationAccountId: optionalUuidSchema,

    categoryId: z.string().uuid("Select a valid category."),

    transactionKind: z.enum(TRANSACTION_KINDS, {
      message: "Select a valid transaction type.",
    }),

    amount: z.coerce
      .number({
        message: "Enter a valid amount.",
      })
      .finite("Enter a valid amount.")
      .positive("The transaction amount must be greater than zero.")
      .max(1_000_000_000_000, "The transaction amount is too large."),

    transactionDate: z
      .string()
      .refine(isValidIsoDate, "Enter a valid transaction date.")
      .refine(
        (value) => value <= getToday(),
        "Future transactions are not available yet.",
      ),

    description: z
      .string()
      .trim()
      .min(2, "Description must contain at least 2 characters.")
      .max(160, "Description cannot exceed 160 characters."),

    merchant: z
      .string()
      .trim()
      .max(100, "Merchant cannot exceed 100 characters."),

    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters."),

    isRecurring: z.boolean(),

    recurrenceFrequency: optionalRecurrenceFrequencySchema,

    recurrenceStartDate: optionalDateSchema,

    recurrenceEndDate: optionalDateSchema,
  })
  .superRefine((data, context) => {
    if (data.transactionKind === "loan_payment" && !data.destinationAccountId) {
      context.addIssue({
        code: "custom",
        path: ["destinationAccountId"],
        message: "Select the loan being paid.",
      });
    }

    if (data.transactionKind !== "loan_payment" && data.destinationAccountId) {
      context.addIssue({
        code: "custom",
        path: ["destinationAccountId"],
        message: "This transaction type cannot have a destination account.",
      });
    }

    if (data.destinationAccountId === data.accountId) {
      context.addIssue({
        code: "custom",
        path: ["destinationAccountId"],
        message: "The source and destination accounts must be different.",
      });
    }

    if (data.isRecurring) {
      if (!data.recurrenceFrequency) {
        context.addIssue({
          code: "custom",
          path: ["recurrenceFrequency"],
          message: "Select how often the transaction repeats.",
        });
      }

      if (!data.recurrenceStartDate) {
        context.addIssue({
          code: "custom",
          path: ["recurrenceStartDate"],
          message: "Select when the recurring schedule starts.",
        });
      }

      if (
        data.recurrenceStartDate &&
        data.recurrenceEndDate &&
        data.recurrenceEndDate < data.recurrenceStartDate
      ) {
        context.addIssue({
          code: "custom",
          path: ["recurrenceEndDate"],
          message: "The end date cannot be before the start date.",
        });
      }
    }
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export type TransactionFormField = keyof TransactionFormValues;

export type TransactionFieldErrors = Partial<
  Record<TransactionFormField, string[]>
>;
