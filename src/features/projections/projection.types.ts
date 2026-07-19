import type { AccountCurrency } from "@/features/accounts/account.types";
import type {
  RecurrenceFrequency,
  TransactionKind,
} from "@/features/transactions/transaction.types";

export interface RecurringProjectionItem {
  id: string;

  description: string;
  accountName: string;
  categoryName: string;

  transactionKind: Extract<
    TransactionKind,
    "income" | "expense" | "loan_payment"
  >;

  nativeAmount: number;
  currency: AccountCurrency;

  amountInDisplayCurrency: number;

  recurrenceFrequency: RecurrenceFrequency;

  recurrenceStartDate: string;
  recurrenceEndDate: string | null;
}

export interface ProjectionPageData {
  displayCurrency: AccountCurrency;
  fxEffectiveDate: string;

  openingBalance: number;
  recurringItems: RecurringProjectionItem[];
}

export interface ProjectionAssumptions {
  months: number;

  additionalMonthlyIncome: number;
  additionalMonthlyExpenses: number;

  annualIncomeGrowthPercent: number;
  annualExpenseInflationPercent: number;
}

export interface ProjectionMonth {
  index: number;
  key: string;
  label: string;

  startDate: string;
  endDate: string;

  openingBalance: number;

  income: number;
  expenses: number;
  loanPayments: number;
  totalOutflow: number;

  netCashFlow: number;
  closingBalance: number;
}

export interface ProjectionSummary {
  endingBalance: number;

  totalIncome: number;
  totalExpenses: number;
  totalLoanPayments: number;

  averageMonthlySavings: number;
  lowestBalance: number;

  negativeBalanceMonth: string | null;
}

export interface ProjectionResult {
  startDate: string;
  endDate: string;

  assumptions: ProjectionAssumptions;
  months: ProjectionMonth[];
  summary: ProjectionSummary;
}
