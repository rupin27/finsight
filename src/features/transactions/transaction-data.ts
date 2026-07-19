import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import type {
  CategoryKind,
  MonthlyTransactionSummary,
  RecurrenceFrequency,
  TransactionCategory,
  TransactionFilters,
  TransactionKind,
  TransactionRecord,
} from "@/features/transactions/transaction.types";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function getTransactionCategories(): Promise<
  TransactionCategory[]
> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
        id,
        name,
        kind,
        icon,
        is_system
      `,
    )
    .eq("user_id", userId)
    .order("kind", {
      ascending: true,
    })
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Unable to load categories: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    kind: row.kind as CategoryKind,

    icon: typeof row.icon === "string" ? row.icon : null,

    isSystem: Boolean(row.is_system),
  }));
}

export async function getTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionRecord[]> {
  const { supabase, userId } = await requireAuthenticatedUser();

  let query = supabase
    .from("transactions")
    .select(
      `
        id,
        account_id,
        destination_account_id,
        category_id,
        transaction_kind,
        amount,
        currency,
        transaction_date,
        description,
        merchant,
        notes,
        is_recurring,
        recurrence_frequency,
        recurrence_start_date,
        recurrence_end_date,
        created_at,
        updated_at
      `,
    )
    .eq("user_id", userId);

  if (filters.transactionKind) {
    query = query.eq("transaction_kind", filters.transactionKind);
  }

  if (filters.accountId) {
    query = query.or(
      `account_id.eq.${filters.accountId},destination_account_id.eq.${filters.accountId}`,
    );
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.dateFrom) {
    query = query.gte("transaction_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("transaction_date", filters.dateTo);
  }

  const searchTerm = sanitizeSearchTerm(filters.query);

  if (searchTerm) {
    query = query.ilike("search_text", `%${searchTerm}%`);
  }

  const { data, error } = await query
    .order("transaction_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(250);

  if (error) {
    throw new Error(`Unable to load transactions: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    accountId: String(row.account_id),

    destinationAccountId:
      typeof row.destination_account_id === "string"
        ? row.destination_account_id
        : null,

    categoryId: typeof row.category_id === "string" ? row.category_id : null,

    transactionKind: row.transaction_kind as TransactionKind,

    amount: Number(row.amount ?? 0),
    currency: row.currency as AccountCurrency,

    transactionDate: String(row.transaction_date),

    description: String(row.description),

    merchant: typeof row.merchant === "string" ? row.merchant : null,

    notes: typeof row.notes === "string" ? row.notes : null,

    isRecurring: Boolean(row.is_recurring),
    recurrenceFrequency:
      typeof row.recurrence_frequency === "string"
        ? (row.recurrence_frequency as RecurrenceFrequency)
        : null,

    recurrenceStartDate:
      typeof row.recurrence_start_date === "string"
        ? row.recurrence_start_date
        : null,

    recurrenceEndDate:
      typeof row.recurrence_end_date === "string"
        ? row.recurrence_end_date
        : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export async function getMonthlyTransactionSummary(): Promise<MonthlyTransactionSummary> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const now = new Date();

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
        transaction_kind,
        amount,
        currency,
        is_recurring
      `,
    )
    .eq("user_id", userId)
    .gte("transaction_date", start.toISOString().slice(0, 10))
    .lt("transaction_date", end.toISOString().slice(0, 10));

  if (error) {
    throw new Error(
      `Unable to load the monthly transaction summary: ${error.message}`,
    );
  }

  const incomeTotals = createEmptyCurrencyTotals();

  const spendingTotals = createEmptyCurrencyTotals();

  let recurringCount = 0;

  for (const row of data ?? []) {
    const currency = row.currency as AccountCurrency;

    const amount = Number(row.amount ?? 0);

    if (row.transaction_kind === "income") {
      incomeTotals[currency] += amount;
    }

    if (
      row.transaction_kind === "expense" ||
      row.transaction_kind === "loan_payment"
    ) {
      spendingTotals[currency] += amount;
    }

    if (row.is_recurring) {
      recurringCount += 1;
    }
  }

  return {
    incomeTotals,
    spendingTotals,
    transactionCount: data?.length ?? 0,
    recurringCount,
  };
}

function createEmptyCurrencyTotals(): Record<AccountCurrency, number> {
  return ACCOUNT_CURRENCIES.reduce(
    (totals, currency) => {
      totals[currency] = 0;
      return totals;
    },
    {} as Record<AccountCurrency, number>,
  );
}

function sanitizeSearchTerm(value?: string): string {
  return value?.trim().replace(/[%_]/g, "").slice(0, 100) ?? "";
}
