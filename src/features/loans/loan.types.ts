import type { AccountCurrency } from "@/features/accounts/account.types";

export const LOAN_RATE_TYPES = ["fixed", "variable"] as const;

export type LoanRateType = (typeof LOAN_RATE_TYPES)[number];

export interface LoanProfile {
  id: string;
  accountId: string;

  lender: string | null;
  originalPrincipal: number | null;

  annualInterestRate: number;
  requiredMonthlyPayment: number;

  nextPaymentDate: string;
  originalTermMonths: number | null;

  rateType: LoanRateType;

  createdAt: string;
  updatedAt: string;
}

export interface StudentLoanRecord {
  accountId: string;
  accountName: string;
  institution: string | null;

  currency: AccountCurrency;

  openingBalance: number;
  currentBalance: number;
  isActive: boolean;

  paymentCount: number;
  totalPaymentsRecorded: number;
  lastPaymentDate: string | null;

  profile: LoanProfile | null;
}

export interface LoanDashboardData {
  displayCurrency: AccountCurrency;
  fxEffectiveDate: string | null;

  totalBalanceInDisplayCurrency: number;
  totalPaymentsInDisplayCurrency: number;

  loans: StudentLoanRecord[];
}

export interface LoanOptimizerAssumptions {
  additionalMonthlyPayment: number;
  oneTimePayment: number;
}

export type AmortizationStatus = "already_paid" | "paid_off" | "not_paid_off";

export interface AmortizationRow {
  period: number;
  paymentDate: string;

  openingBalance: number;
  interest: number;

  scheduledPayment: number;
  additionalMonthlyPayment: number;
  oneTimePayment: number;

  totalPayment: number;
  principalPaid: number;

  closingBalance: number;
}

export interface AmortizationScenario {
  status: AmortizationStatus;

  openingBalance: number;
  annualInterestRate: number;

  requiredMonthlyPayment: number;
  additionalMonthlyPayment: number;
  oneTimePayment: number;

  monthsToPayoff: number | null;
  payoffDate: string | null;

  totalInterest: number;
  totalPaid: number;
  totalPrincipalPaid: number;

  schedule: AmortizationRow[];
}

export interface LoanScenarioComparison {
  baseline: AmortizationScenario;
  accelerated: AmortizationScenario;

  interestSaved: number | null;
  monthsSaved: number | null;
}
