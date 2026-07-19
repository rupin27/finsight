"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccounts } from "@/features/accounts/account-data";
import type { AccountCurrency } from "@/features/accounts/account.types";
import type { GoalActionState } from "@/features/goals/goal-action-state";
import type { FinancialGoalType } from "@/features/goals/goal.types";
import {
  financialGoalFormSchema,
  type FinancialGoalFieldErrors,
} from "@/features/goals/goal-validation";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { convertAmount } from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";

const goalIdSchema = z.string().uuid();

function getString(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function parseGoalForm(formData: FormData) {
  return financialGoalFormSchema.safeParse({
    name: getString(formData, "name"),

    goalType: getString(formData, "goalType"),

    progressSource: getString(formData, "progressSource"),

    currency: getString(formData, "currency"),

    targetAmount: getString(formData, "targetAmount"),

    manualCurrentAmount: getString(formData, "manualCurrentAmount"),

    targetDate: getString(formData, "targetDate"),

    linkedAccountId: getString(formData, "linkedAccountId"),

    plannedMonthlyContribution: getString(
      formData,
      "plannedMonthlyContribution",
    ),

    emergencyFundMonths: getString(formData, "emergencyFundMonths"),

    priority: getString(formData, "priority"),

    notes: getString(formData, "notes"),
  });
}

export async function createFinancialGoal(
  _previousState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const parsed = parseGoalForm(formData);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const linkedResult = await resolveLinkedAccount({
    goalType: parsed.data.goalType,

    linkedAccountId: parsed.data.linkedAccountId,

    currency: parsed.data.currency,
  });

  if (!linkedResult.success) {
    return {
      status: "error",
      message: linkedResult.error,
    };
  }

  const { error } = await supabase.from("financial_goal_plans").insert({
    user_id: userId,

    name: parsed.data.name,

    goal_type: parsed.data.goalType,

    progress_source: parsed.data.progressSource,

    target_amount: usesFixedTarget(parsed.data.goalType)
      ? parsed.data.targetAmount
      : null,

    manual_current_amount:
      parsed.data.progressSource === "manual"
        ? parsed.data.manualCurrentAmount
        : 0,

    currency: parsed.data.currency,

    target_date: parsed.data.targetDate,

    linked_account_id:
      parsed.data.progressSource === "linked_account"
        ? parsed.data.linkedAccountId
        : null,

    baseline_amount: linkedResult.baselineAmount,

    planned_monthly_contribution: parsed.data.plannedMonthlyContribution,

    emergency_fund_months:
      parsed.data.goalType === "emergency_fund"
        ? parsed.data.emergencyFundMonths
        : null,

    priority: parsed.data.priority,

    status: "active",

    notes: parsed.data.notes || null,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateGoalPages();

  return {
    status: "success",
    message: "Financial goal created.",
  };
}

export async function updateFinancialGoal(
  goalId: string,
  _previousState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const parsedGoalId = goalIdSchema.safeParse(goalId);

  if (!parsedGoalId.success) {
    return {
      status: "error",
      message: "The goal identifier is invalid.",
    };
  }

  const parsed = parseGoalForm(formData);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { data: existingGoal } = await supabase
    .from("financial_goal_plans")
    .select(
      `
          linked_account_id,
          baseline_amount
        `,
    )
    .eq("id", parsedGoalId.data)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existingGoal) {
    return {
      status: "error",
      message: "The financial goal was not found.",
    };
  }

  const linkedResult = await resolveLinkedAccount({
    goalType: parsed.data.goalType,

    linkedAccountId: parsed.data.linkedAccountId,

    currency: parsed.data.currency,

    previousLinkedAccountId:
      typeof existingGoal.linked_account_id === "string"
        ? existingGoal.linked_account_id
        : null,

    previousBaseline:
      existingGoal.baseline_amount === null
        ? null
        : Number(existingGoal.baseline_amount),
  });

  if (!linkedResult.success) {
    return {
      status: "error",
      message: linkedResult.error,
    };
  }

  const { error } = await supabase
    .from("financial_goal_plans")
    .update({
      name: parsed.data.name,

      goal_type: parsed.data.goalType,

      progress_source: parsed.data.progressSource,

      target_amount: usesFixedTarget(parsed.data.goalType)
        ? parsed.data.targetAmount
        : null,

      manual_current_amount:
        parsed.data.progressSource === "manual"
          ? parsed.data.manualCurrentAmount
          : 0,

      currency: parsed.data.currency,

      target_date: parsed.data.targetDate,

      linked_account_id:
        parsed.data.progressSource === "linked_account"
          ? parsed.data.linkedAccountId
          : null,

      baseline_amount: linkedResult.baselineAmount,

      planned_monthly_contribution: parsed.data.plannedMonthlyContribution,

      emergency_fund_months:
        parsed.data.goalType === "emergency_fund"
          ? parsed.data.emergencyFundMonths
          : null,

      priority: parsed.data.priority,

      notes: parsed.data.notes || null,
    })
    .eq("id", parsedGoalId.data)
    .eq("user_id", userId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateGoalPages();

  return {
    status: "success",
    message: "Financial goal updated.",
  };
}

export async function archiveFinancialGoal(goalId: string) {
  return updateGoalStatus(goalId, "archived");
}

export async function reactivateFinancialGoal(goalId: string) {
  return updateGoalStatus(goalId, "active");
}

export async function deleteFinancialGoal(goalId: string) {
  const parsed = goalIdSchema.safeParse(goalId);

  if (!parsed.success) {
    return {
      success: false,
      error: "The goal identifier is invalid.",
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase
    .from("financial_goal_plans")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidateGoalPages();

  return {
    success: true,
  };
}

async function updateGoalStatus(goalId: string, status: "active" | "archived") {
  const parsed = goalIdSchema.safeParse(goalId);

  if (!parsed.success) {
    return {
      success: false,
      error: "The goal identifier is invalid.",
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase
    .from("financial_goal_plans")
    .update({ status })
    .eq("id", parsed.data)
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidateGoalPages();

  return {
    success: true,
  };
}

async function resolveLinkedAccount({
  goalType,
  linkedAccountId,
  currency,
  previousLinkedAccountId = null,
  previousBaseline = null,
}: {
  goalType: FinancialGoalType;
  linkedAccountId: string | null;
  currency: AccountCurrency;

  previousLinkedAccountId?: string | null;
  previousBaseline?: number | null;
}): Promise<
  | {
      success: true;
      baselineAmount: number | null;
    }
  | {
      success: false;
      error: string;
    }
> {
  if (!linkedAccountId) {
    return {
      success: true,
      baselineAmount: null,
    };
  }

  const accounts = await getAccounts();

  const account = accounts.find(
    (candidate) => candidate.id === linkedAccountId,
  );

  if (!account) {
    return {
      success: false,
      error: "The linked account was not found.",
    };
  }

  if (goalType === "loan_payoff" && account.accountType !== "loan") {
    return {
      success: false,
      error: "Loan-payoff goals must use a loan account.",
    };
  }

  if (goalType !== "loan_payoff" && account.accountType === "loan") {
    return {
      success: false,
      error: "Savings goals cannot track a loan account.",
    };
  }

  if (goalType !== "loan_payoff") {
    return {
      success: true,
      baselineAmount: null,
    };
  }

  if (
    previousLinkedAccountId === linkedAccountId &&
    previousBaseline !== null
  ) {
    return {
      success: true,
      baselineAmount: previousBaseline,
    };
  }

  try {
    const snapshot = await getExchangeRateSnapshot(currency);

    return {
      success: true,

      baselineAmount: Math.max(
        0.01,
        convertAmount(
          Math.max(0, account.currentBalance),
          account.currency,
          currency,
          snapshot,
        ),
      ),
    };
  } catch {
    return {
      success: false,
      error:
        "FinSight could not calculate the starting loan balance in the selected goal currency.",
    };
  }
}

function usesFixedTarget(goalType: FinancialGoalType) {
  return goalType === "savings" || goalType === "custom";
}

function validationFailure(error: z.ZodError): GoalActionState {
  return {
    status: "error",

    message: "Please correct the highlighted goal details.",

    fieldErrors: error.flatten().fieldErrors as FinancialGoalFieldErrors,
  };
}

function revalidateGoalPages() {
  revalidatePath("/goals");
  revalidatePath("/overview");
  revalidatePath("/projections");
  revalidatePath("/loans");
  revalidatePath("/insights");
}
