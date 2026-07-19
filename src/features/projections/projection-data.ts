import { type AccountCurrency } from "@/features/accounts/account.types";
import { getAccounts } from "@/features/accounts/account-data";
import type {
  ProjectionPageData,
  RecurringProjectionItem,
} from "@/features/projections/projection.types";
import {
  RECURRENCE_FREQUENCIES,
  type RecurrenceFrequency,
  type TransactionKind,
} from "@/features/transactions/transaction.types";
import { getTransactionCategories } from "@/features/transactions/transaction-data";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import { convertAmount } from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";

export async function getProjectionPageData(): Promise<ProjectionPageData> {
  const [accounts, categories, displayCurrency] = await Promise.all([
    getAccounts(),
    getTransactionCategories(),
    getUserDefaultCurrency(),
  ]);

  const fxSnapshot = await getExchangeRateSnapshot(displayCurrency);

  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
        id,
        account_id,
        category_id,
        transaction_kind,
        amount,
        currency,
        description,
        recurrence_frequency,
        recurrence_start_date,
        recurrence_end_date
      `,
    )
    .eq("user_id", userId)
    .eq("is_recurring", true)
    .in("transaction_kind", ["income", "expense", "loan_payment"])
    .order("recurrence_start_date", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Unable to load recurring transactions: ${error.message}`);
  }

  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );

  const recurringItems: RecurringProjectionItem[] = [];

  for (const row of data ?? []) {
    const recurrenceFrequency = row.recurrence_frequency;

    const recurrenceStartDate = row.recurrence_start_date;

    const transactionKind = row.transaction_kind;

    const currency = row.currency as AccountCurrency;

    if (
      typeof recurrenceFrequency !== "string" ||
      !RECURRENCE_FREQUENCIES.includes(
        recurrenceFrequency as RecurrenceFrequency,
      ) ||
      typeof recurrenceStartDate !== "string" ||
      (transactionKind !== "income" &&
        transactionKind !== "expense" &&
        transactionKind !== "loan_payment")
    ) {
      continue;
    }

    const account = accountMap.get(String(row.account_id));

    const category =
      typeof row.category_id === "string"
        ? categoryMap.get(row.category_id)
        : undefined;

    const nativeAmount = Number(row.amount ?? 0);

    recurringItems.push({
      id: String(row.id),

      description: String(row.description),

      accountName: account?.name ?? "Unknown account",

      categoryName: category?.name ?? "Uncategorized",

      transactionKind: transactionKind as Extract<
        TransactionKind,
        "income" | "expense" | "loan_payment"
      >,

      nativeAmount,
      currency,

      amountInDisplayCurrency: convertAmount(
        nativeAmount,
        currency,
        displayCurrency,
        fxSnapshot,
      ),

      recurrenceFrequency: recurrenceFrequency as RecurrenceFrequency,

      recurrenceStartDate,

      recurrenceEndDate:
        typeof row.recurrence_end_date === "string"
          ? row.recurrence_end_date
          : null,
    });
  }

  const openingBalance = accounts
    .filter((account) => account.isActive && account.accountType !== "loan")
    .reduce((total, account) => {
      return (
        total +
        convertAmount(
          account.currentBalance,
          account.currency,
          displayCurrency,
          fxSnapshot,
        )
      );
    }, 0);

  return {
    displayCurrency,
    fxEffectiveDate: fxSnapshot.effectiveDate,

    openingBalance,
    recurringItems,
  };
}
