"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { LoanProfileActionState } from "@/features/loans/loan-profile-action-state";
import {
  loanProfileFormSchema,
  type LoanProfileFieldErrors,
} from "@/features/loans/loan-profile-validation";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const accountIdSchema = z.string().uuid();

function getString(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function parseLoanProfileForm(formData: FormData) {
  return loanProfileFormSchema.safeParse({
    lender: getString(formData, "lender"),

    originalPrincipal: getString(formData, "originalPrincipal"),

    annualInterestRate: getString(formData, "annualInterestRate"),

    requiredMonthlyPayment: getString(formData, "requiredMonthlyPayment"),

    nextPaymentDate: getString(formData, "nextPaymentDate"),

    originalTermMonths: getString(formData, "originalTermMonths"),

    rateType: getString(formData, "rateType"),
  });
}

export async function saveLoanProfile(
  accountId: string,
  _previousState: LoanProfileActionState,
  formData: FormData,
): Promise<LoanProfileActionState> {
  const parsedAccountId = accountIdSchema.safeParse(accountId);

  if (!parsedAccountId.success) {
    return {
      status: "error",
      message: "The loan account identifier is invalid.",
    };
  }

  const parsed = parseLoanProfileForm(formData);

  if (!parsed.success) {
    return {
      status: "error",

      message: "Please correct the highlighted repayment details.",

      fieldErrors: parsed.error.flatten().fieldErrors as LoanProfileFieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select(
      `
        id,
        account_type
      `,
    )
    .eq("id", parsedAccountId.data)
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError || !account) {
    return {
      status: "error",
      message: "The selected loan account was not found.",
    };
  }

  if (account.account_type !== "loan") {
    return {
      status: "error",
      message: "The selected account is not a loan account.",
    };
  }

  const { data, error } = await supabase
    .from("loan_profiles")
    .upsert(
      {
        user_id: userId,

        account_id: parsedAccountId.data,

        lender: parsed.data.lender.length > 0 ? parsed.data.lender : null,

        original_principal: parsed.data.originalPrincipal,

        annual_interest_rate: parsed.data.annualInterestRate,

        required_monthly_payment: parsed.data.requiredMonthlyPayment,

        next_payment_date: parsed.data.nextPaymentDate,

        original_term_months: parsed.data.originalTermMonths,

        rate_type: parsed.data.rateType,
      },
      {
        onConflict: "account_id",
      },
    )
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",

      message:
        error?.message ?? "The loan repayment profile could not be saved.",
    };
  }

  revalidatePath("/loans");
  revalidatePath("/overview");
  revalidatePath("/goals");
  revalidatePath("/insights");

  return {
    status: "success",
    message: "Loan repayment profile saved.",
  };
}
