import { z } from "zod";

import { LOAN_RATE_TYPES } from "@/features/loans/loan.types";

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

function emptyStringToNull(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return value;
}

const optionalPositiveNumber = z.preprocess(
  emptyStringToNull,
  z.coerce.number().finite().positive().max(1_000_000_000_000).nullable(),
);

const optionalTermMonths = z.preprocess(
  emptyStringToNull,
  z.coerce.number().int().min(1).max(600).nullable(),
);

export const loanProfileFormSchema = z.object({
  lender: z.string().trim().max(100, "Lender cannot exceed 100 characters."),

  originalPrincipal: optionalPositiveNumber,

  annualInterestRate: z.coerce
    .number({
      message: "Enter a valid annual interest rate.",
    })
    .finite()
    .min(0, "Interest rate cannot be negative.")
    .max(100, "Interest rate cannot exceed 100%."),

  requiredMonthlyPayment: z.coerce
    .number({
      message: "Enter a valid required payment.",
    })
    .finite()
    .positive("Required monthly payment must be greater than zero.")
    .max(1_000_000_000_000, "The required payment is too large."),

  nextPaymentDate: z
    .string()
    .refine(isValidIsoDate, "Enter a valid next-payment date."),

  originalTermMonths: optionalTermMonths,

  rateType: z.enum(LOAN_RATE_TYPES, {
    message: "Select a valid interest-rate type.",
  }),
});

export type LoanProfileFormValues = z.infer<typeof loanProfileFormSchema>;

export type LoanProfileFormField = keyof LoanProfileFormValues;

export type LoanProfileFieldErrors = Partial<
  Record<LoanProfileFormField, string[]>
>;
