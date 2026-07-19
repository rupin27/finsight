"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AccountActionState } from "@/features/accounts/account-action-state";
import {
  accountFormSchema,
  type AccountFieldErrors,
} from "@/features/accounts/account-validation";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const accountIdSchema = z.string().uuid();

function parseAccountForm(formData: FormData) {
  return accountFormSchema.safeParse({
    name: formData.get("name"),
    institution: formData.get("institution"),
    accountType: formData.get("accountType"),
    country: formData.get("country"),
    currency: formData.get("currency"),
    openingBalance: formData.get("openingBalance"),
    openingBalanceDate: formData.get("openingBalanceDate"),
  });
}

function revalidateAccountPages() {
  revalidatePath("/accounts");
  revalidatePath("/overview");
  revalidatePath("/projections");
  revalidatePath("/loans");
  revalidatePath("/goals");
  revalidatePath("/insights");
}

function getDatabaseErrorMessage(
  error: {
    code?: string;
    message: string;
  },
  fallback: string,
): string {
  if (error.code === "23505") {
    return "You already have an account with this name.";
  }

  return error.message || fallback;
}

function createAccountsErrorUrl(message: string): string {
  return `/accounts?error=${encodeURIComponent(message)}`;
}

export async function createAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = parseAccountForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted account details.",
      fieldErrors: parsed.error.flatten().fieldErrors as AccountFieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase.from("accounts").insert({
    user_id: userId,
    name: parsed.data.name,
    institution:
      parsed.data.institution.length > 0 ? parsed.data.institution : null,
    account_type: parsed.data.accountType,
    country: parsed.data.country,
    currency: parsed.data.currency,
    opening_balance: parsed.data.openingBalance,
    opening_balance_date: parsed.data.openingBalanceDate,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: getDatabaseErrorMessage(
        error,
        "The account could not be created.",
      ),
    };
  }

  revalidateAccountPages();

  return {
    status: "success",
    message: "Account created successfully.",
  };
}

export async function updateAccount(
  accountId: string,
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsedId = accountIdSchema.safeParse(accountId);

  if (!parsedId.success) {
    return {
      status: "error",
      message: "The account identifier is invalid.",
    };
  }

  const parsed = parseAccountForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted account details.",
      fieldErrors: parsed.error.flatten().fieldErrors as AccountFieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("accounts")
    .update({
      name: parsed.data.name,
      institution:
        parsed.data.institution.length > 0 ? parsed.data.institution : null,
      account_type: parsed.data.accountType,
      country: parsed.data.country,
      currency: parsed.data.currency,
      opening_balance: parsed.data.openingBalance,
      opening_balance_date: parsed.data.openingBalanceDate,
    })
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",
      message: getDatabaseErrorMessage(
        error,
        "The account could not be updated.",
      ),
    };
  }

  if (!data) {
    return {
      status: "error",
      message: "The account was not found or you do not have access to it.",
    };
  }

  revalidateAccountPages();

  return {
    status: "success",
    message: "Account updated successfully.",
  };
}

export async function toggleAccountActive(
  accountId: string,
  isActive: boolean,
  _formData?: FormData,
): Promise<void> {
  const parsedId = accountIdSchema.safeParse(accountId);

  if (!parsedId.success) {
    redirect(createAccountsErrorUrl("The account identifier is invalid."));
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("accounts")
    .update({
      is_active: isActive,
    })
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(
      createAccountsErrorUrl(
        error?.message ?? "The account status could not be changed.",
      ),
    );
  }

  revalidateAccountPages();
}

export async function deleteAccount(
  accountId: string,
  _formData?: FormData,
): Promise<void> {
  const parsedId = accountIdSchema.safeParse(accountId);

  if (!parsedId.success) {
    redirect(createAccountsErrorUrl("The account identifier is invalid."));
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .or(
      `account_id.eq.${parsedId.data},destination_account_id.eq.${parsedId.data}`,
    );

  if (countError) {
    redirect(
      createAccountsErrorUrl("FinSight could not check the account history."),
    );
  }

  if ((count ?? 0) > 0) {
    redirect(
      createAccountsErrorUrl(
        "This account contains transactions and cannot be deleted. Deactivate it instead.",
      ),
    );
  }

  const { data, error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(
      createAccountsErrorUrl(
        error?.message ?? "The account could not be deleted.",
      ),
    );
  }

  revalidateAccountPages();
}
