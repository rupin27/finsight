"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AccountCurrency } from "@/features/accounts/account.types";
import type { TransactionActionState } from "@/features/transactions/transaction-action-state";
import {
  transactionFormSchema,
  type TransactionFieldErrors,
  type TransactionFormValues,
} from "@/features/transactions/transaction-validation";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

const transactionIdSchema = z.string().uuid();

interface OwnedAccount {
  id: string;
  accountType: string;
  currency: AccountCurrency;
  isActive: boolean;
}

interface ReferenceValidationResult {
  error?: string;
  currency?: AccountCurrency;
}

function getString(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function parseTransactionForm(formData: FormData) {
  return transactionFormSchema.safeParse({
    accountId: getString(formData, "accountId"),

    destinationAccountId: getString(formData, "destinationAccountId"),

    categoryId: getString(formData, "categoryId"),

    transactionKind: getString(formData, "transactionKind"),

    amount: getString(formData, "amount"),

    transactionDate: getString(formData, "transactionDate"),

    description: getString(formData, "description"),

    merchant: getString(formData, "merchant"),

    notes: getString(formData, "notes"),

    isRecurring: formData.get("isRecurring") === "on",

    recurrenceFrequency: getString(formData, "recurrenceFrequency"),

    recurrenceStartDate: getString(formData, "recurrenceStartDate"),

    recurrenceEndDate: getString(formData, "recurrenceEndDate"),
  });
}

function revalidateFinancialPages() {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/overview");
  revalidatePath("/loans");
  revalidatePath("/projections");
  revalidatePath("/goals");
  revalidatePath("/insights");
}

function createTransactionsErrorUrl(message: string): string {
  return `/transactions?error=${encodeURIComponent(message)}`;
}

function mapDatabaseError(
  error: {
    code?: string;
    message: string;
  },
  fallback: string,
): string {
  if (error.code === "23503") {
    return "One of the selected financial records no longer exists.";
  }

  if (error.code === "23514") {
    return error.message;
  }

  return error.message || fallback;
}

async function getOwnedAccount(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<OwnedAccount | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select(
      `
          id,
          account_type,
          currency,
          is_active
        `,
    )
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),

    accountType: String(data.account_type),

    currency: data.currency as AccountCurrency,

    isActive: Boolean(data.is_active),
  };
}

async function validateReferences(
  supabase: SupabaseClient,
  userId: string,
  values: TransactionFormValues,
  requireActiveAccounts: boolean,
): Promise<ReferenceValidationResult> {
  const sourceAccount = await getOwnedAccount(
    supabase,
    userId,
    values.accountId,
  );

  if (!sourceAccount) {
    return {
      error: "The selected source account was not found.",
    };
  }

  if (requireActiveAccounts && !sourceAccount.isActive) {
    return {
      error: "New transactions cannot be added to an inactive account.",
    };
  }

  if (sourceAccount.accountType === "loan") {
    return {
      error: "Select a bank or cash account as the transaction source.",
    };
  }

  const expectedCategoryKind =
    values.transactionKind === "income" ? "income" : "expense";

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, kind")
    .eq("id", values.categoryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (categoryError || !category) {
    return {
      error: "The selected transaction category was not found.",
    };
  }

  if (category.kind !== expectedCategoryKind) {
    return {
      error:
        values.transactionKind === "income"
          ? "Select an income category."
          : "Select an expense category.",
    };
  }

  if (values.transactionKind === "loan_payment") {
    if (!values.destinationAccountId) {
      return {
        error: "Select the loan being paid.",
      };
    }

    const destinationAccount = await getOwnedAccount(
      supabase,
      userId,
      values.destinationAccountId,
    );

    if (!destinationAccount) {
      return {
        error: "The selected loan account was not found.",
      };
    }

    if (requireActiveAccounts && !destinationAccount.isActive) {
      return {
        error: "New payments cannot be added to an inactive loan.",
      };
    }

    if (destinationAccount.accountType !== "loan") {
      return {
        error: "The destination account must be a loan.",
      };
    }

    if (destinationAccount.currency !== sourceAccount.currency) {
      return {
        error:
          "Cross-currency loan payments will be enabled with the FX module.",
      };
    }
  }

  return {
    currency: sourceAccount.currency,
  };
}

export async function createTransaction(
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const parsed = parseTransactionForm(formData);

  if (!parsed.success) {
    return {
      status: "error",

      message: "Please correct the highlighted transaction details.",

      fieldErrors: parsed.error.flatten().fieldErrors as TransactionFieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const references = await validateReferences(
    supabase,
    userId,
    parsed.data,
    true,
  );

  if (references.error || !references.currency) {
    return {
      status: "error",

      message: references.error ?? "The transaction references are invalid.",
    };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: userId,

    account_id: parsed.data.accountId,

    destination_account_id: parsed.data.destinationAccountId,

    category_id: parsed.data.categoryId,

    transaction_kind: parsed.data.transactionKind,

    amount: parsed.data.amount,

    currency: references.currency,

    transaction_date: parsed.data.transactionDate,

    description: parsed.data.description,

    merchant: parsed.data.merchant.length > 0 ? parsed.data.merchant : null,

    notes: parsed.data.notes.length > 0 ? parsed.data.notes : null,

    is_recurring: parsed.data.isRecurring,

    recurrence_frequency: parsed.data.isRecurring
      ? parsed.data.recurrenceFrequency
      : null,

    recurrence_start_date: parsed.data.isRecurring
      ? parsed.data.recurrenceStartDate
      : null,

    recurrence_end_date: parsed.data.isRecurring
      ? parsed.data.recurrenceEndDate
      : null,
  });

  if (error) {
    return {
      status: "error",

      message: mapDatabaseError(error, "The transaction could not be created."),
    };
  }

  revalidateFinancialPages();

  return {
    status: "success",

    message: "Transaction created successfully.",
  };
}

export async function updateTransaction(
  transactionId: string,
  _previousState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const parsedId = transactionIdSchema.safeParse(transactionId);

  if (!parsedId.success) {
    return {
      status: "error",

      message: "The transaction identifier is invalid.",
    };
  }

  const parsed = parseTransactionForm(formData);

  if (!parsed.success) {
    return {
      status: "error",

      message: "Please correct the highlighted transaction details.",

      fieldErrors: parsed.error.flatten().fieldErrors as TransactionFieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const references = await validateReferences(
    supabase,
    userId,
    parsed.data,
    false,
  );

  if (references.error || !references.currency) {
    return {
      status: "error",

      message: references.error ?? "The transaction references are invalid.",
    };
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({
      account_id: parsed.data.accountId,

      destination_account_id: parsed.data.destinationAccountId,

      category_id: parsed.data.categoryId,

      transaction_kind: parsed.data.transactionKind,

      amount: parsed.data.amount,

      currency: references.currency,

      transaction_date: parsed.data.transactionDate,

      description: parsed.data.description,

      merchant: parsed.data.merchant.length > 0 ? parsed.data.merchant : null,

      notes: parsed.data.notes.length > 0 ? parsed.data.notes : null,

      is_recurring: parsed.data.isRecurring,

      recurrence_frequency: parsed.data.isRecurring
        ? parsed.data.recurrenceFrequency
        : null,

      recurrence_start_date: parsed.data.isRecurring
        ? parsed.data.recurrenceStartDate
        : null,

      recurrence_end_date: parsed.data.isRecurring
        ? parsed.data.recurrenceEndDate
        : null,
    })
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",

      message: mapDatabaseError(error, "The transaction could not be updated."),
    };
  }

  if (!data) {
    return {
      status: "error",

      message: "The transaction was not found or you do not have access to it.",
    };
  }

  revalidateFinancialPages();

  return {
    status: "success",

    message: "Transaction updated successfully.",
  };
}

export async function deleteTransaction(
  transactionId: string,
  _formData?: FormData,
): Promise<void> {
  void _formData;

  const parsedId = transactionIdSchema.safeParse(transactionId);

  if (!parsedId.success) {
    redirect(
      createTransactionsErrorUrl("The transaction identifier is invalid."),
    );
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(
      createTransactionsErrorUrl(
        error?.message ?? "The transaction could not be deleted.",
      ),
    );
  }

  revalidateFinancialPages();
}
