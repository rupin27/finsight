"use server";

import { revalidatePath } from "next/cache";

import type { SettingsActionState } from "@/features/settings/settings-action-state";
import {
  deleteTransactionsSchema,
  resetFinancialDataSchema,
} from "@/features/settings/settings-validation";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

function getString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

export async function deleteAllTransactions(
  _previousState: SettingsActionState,

  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = deleteTransactionsSchema.safeParse({
    confirmation: getString(formData, "confirmation"),
  });

  if (!parsed.success) {
    return {
      status: "error",

      message:
        parsed.error.issues[0]?.message ??
        "The confirmation text is incorrect.",
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateAllFinancialPages();

  return {
    status: "success",

    message:
      "All transactions were deleted. Accounts, loan profiles, and goals were preserved.",
  };
}

export async function resetFinancialData(
  _previousState: SettingsActionState,

  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = resetFinancialDataSchema.safeParse({
    confirmation: getString(formData, "confirmation"),
  });

  if (!parsed.success) {
    return {
      status: "error",

      message:
        parsed.error.issues[0]?.message ??
        "The confirmation text is incorrect.",
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const tablesInDeletionOrder = [
    "financial_goal_plans",
    "loan_profiles",
    "transactions",
    "accounts",
  ] as const;

  for (const table of tablesInDeletionOrder) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);

    if (error) {
      return {
        status: "error",

        message: `FinSight stopped while clearing ${table}: ${error.message}`,
      };
    }
  }

  revalidateAllFinancialPages();

  return {
    status: "success",

    message:
      "Financial data was reset. Your profile, preferences, authentication, and AI usage history were preserved.",
  };
}

function revalidateAllFinancialPages() {
  revalidatePath("/settings");
  revalidatePath("/overview");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/currency");
  revalidatePath("/projections");
  revalidatePath("/loans");
  revalidatePath("/goals");
  revalidatePath("/insights");
}
