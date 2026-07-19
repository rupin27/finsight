import { z } from "zod";

import { ACCOUNT_CURRENCIES } from "@/features/accounts/account.types";
import {
  FINANCIAL_GOAL_TYPES,
  GOAL_PROGRESS_SOURCES,
} from "@/features/goals/goal.types";

function emptyStringToNull(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return value;
}

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

const optionalPositiveAmount = z.preprocess(
  emptyStringToNull,
  z.coerce.number().finite().positive().max(1_000_000_000_000).nullable(),
);

const optionalUuid = z.preprocess(
  emptyStringToNull,
  z.string().uuid().nullable(),
);

const optionalDate = z.preprocess(
  emptyStringToNull,
  z.string().refine(isValidIsoDate, "Enter a valid target date.").nullable(),
);

const optionalEmergencyMonths = z.preprocess(
  emptyStringToNull,
  z.coerce.number().int().min(1).max(24).nullable(),
);

export const financialGoalFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Goal name must contain at least 2 characters.")
      .max(100, "Goal name cannot exceed 100 characters."),

    goalType: z.enum(FINANCIAL_GOAL_TYPES),

    progressSource: z.enum(GOAL_PROGRESS_SOURCES),

    currency: z.enum(ACCOUNT_CURRENCIES),

    targetAmount: optionalPositiveAmount,

    manualCurrentAmount: z.coerce
      .number()
      .finite()
      .min(0, "Current progress cannot be negative.")
      .max(1_000_000_000_000),

    targetDate: optionalDate,

    linkedAccountId: optionalUuid,

    plannedMonthlyContribution: z.coerce
      .number()
      .finite()
      .min(0, "Monthly contribution cannot be negative.")
      .max(1_000_000_000_000),

    emergencyFundMonths: optionalEmergencyMonths,

    priority: z.coerce.number().int().min(1).max(5),

    notes: z.string().trim().max(1000, "Notes cannot exceed 1,000 characters."),
  })
  .superRefine((data, context) => {
    if (
      (data.goalType === "savings" || data.goalType === "custom") &&
      !data.targetAmount
    ) {
      context.addIssue({
        code: "custom",
        path: ["targetAmount"],
        message: "Enter a target amount.",
      });
    }

    if (data.goalType === "emergency_fund" && !data.emergencyFundMonths) {
      context.addIssue({
        code: "custom",
        path: ["emergencyFundMonths"],
        message: "Select the number of expense months to cover.",
      });
    }

    if (data.goalType === "loan_payoff" && !data.linkedAccountId) {
      context.addIssue({
        code: "custom",
        path: ["linkedAccountId"],
        message: "Select the loan account.",
      });
    }

    if (
      data.goalType === "loan_payoff" &&
      data.progressSource !== "linked_account"
    ) {
      context.addIssue({
        code: "custom",
        path: ["progressSource"],
        message: "Loan progress must come from the linked loan account.",
      });
    }

    if (data.progressSource === "linked_account" && !data.linkedAccountId) {
      context.addIssue({
        code: "custom",
        path: ["linkedAccountId"],
        message: "Select an account to track this goal.",
      });
    }

    if (data.progressSource === "manual" && data.linkedAccountId) {
      context.addIssue({
        code: "custom",
        path: ["linkedAccountId"],
        message: "Manual goals cannot have a linked account.",
      });
    }
  });

export type FinancialGoalFormValues = z.infer<typeof financialGoalFormSchema>;

export type FinancialGoalFormField = keyof FinancialGoalFormValues;

export type FinancialGoalFieldErrors = Partial<
  Record<FinancialGoalFormField, string[]>
>;
