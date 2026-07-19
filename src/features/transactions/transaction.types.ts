import type {
  AccountCurrency,
  AccountType,
} from "@/features/accounts/account.types";

export const TRANSACTION_KINDS = ["income", "expense", "loan_payment"] as const;

export const CATEGORY_KINDS = ["income", "expense"] as const;

export const RECURRENCE_FREQUENCIES = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export interface TransactionCategory {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string | null;
  isSystem: boolean;
}

export interface TransactionRecord {
  id: string;

  accountId: string;
  destinationAccountId: string | null;
  categoryId: string | null;

  transactionKind: TransactionKind;
  amount: number;
  currency: AccountCurrency;
  transactionDate: string;

  description: string;
  merchant: string | null;
  notes: string | null;

  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrenceStartDate: string | null;
  recurrenceEndDate: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  query?: string;
  transactionKind?: TransactionKind;
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MonthlyTransactionSummary {
  incomeTotals: Record<AccountCurrency, number>;

  spendingTotals: Record<AccountCurrency, number>;

  transactionCount: number;
  recurringCount: number;
}

export const TRANSACTION_KIND_LABELS: Record<TransactionKind, string> = {
  income: "Income",
  expense: "Expense",
  loan_payment: "Loan payment",
};

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> =
  {
    weekly: "Weekly",
    biweekly: "Every two weeks",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Annually",
  };

export interface TransactionAccountOption {
  id: string;
  name: string;
  accountType: AccountType;
  currency: AccountCurrency;
  isActive: boolean;
}
