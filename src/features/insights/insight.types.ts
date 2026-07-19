import type { AccountCurrency } from "@/features/accounts/account.types";

export type InsightSeverity = "critical" | "warning" | "positive" | "info";

export type InsightCategory =
  | "cash_flow"
  | "spending"
  | "emergency_fund"
  | "debt"
  | "goals"
  | "data_quality";

export interface FinancialInsight {
  id: string;

  title: string;
  summary: string;
  detail: string;

  severity: InsightSeverity;
  category: InsightCategory;

  metric?: string;

  actionLabel?: string;
  actionHref?: string;
}

export type HealthScoreGrade =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Needs attention";

export interface HealthScoreComponent {
  key:
    | "savings_rate"
    | "emergency_fund"
    | "debt_burden"
    | "goal_health"
    | "cash_flow_risk";

  label: string;

  score: number;
  maximumScore: number;

  summary: string;
}

export interface FinancialHealthScore {
  score: number;
  maximumScore: 100;

  grade: HealthScoreGrade;

  components: HealthScoreComponent[];
}

export interface SpendingTrend {
  lastCompletedMonth: string;

  lastMonthSpending: number;
  priorThreeMonthAverage: number;

  changePercent: number | null;

  topCategoryName: string | null;
  topCategoryAmount: number;
}

export interface ExpenseAnomaly {
  transactionId: string;

  transactionDate: string;
  description: string;
  categoryName: string;

  amount: number;
  robustZScore: number | null;
}

export interface LoanOpportunity {
  accountId: string;
  accountName: string;

  currency: AccountCurrency;

  suggestedAdditionalPayment: number;
  suggestedAdditionalPaymentInDisplayCurrency: number;

  interestSaved: number;
  interestSavedInDisplayCurrency: number;

  monthsSaved: number;
}

export interface FinancialInsightSnapshot {
  generatedAt: string;
  displayCurrency: AccountCurrency;

  liquidBalance: number;

  expectedMonthlyIncome: number;
  expectedMonthlyOutflow: number;
  expectedMonthlySavings: number;

  savingsRatePercent: number | null;
  emergencyFundMonths: number | null;
  debtPaymentRatioPercent: number | null;

  projectedEndingBalance12Months: number;
  projectedNegativeBalanceMonth: string | null;

  activeGoalCount: number;
  completedGoalCount: number;
  onTrackGoalCount: number;
  behindGoalCount: number;

  plannedMonthlyGoalAllocations: number;
  availableAfterGoalAllocations: number;

  configuredLoanCount: number;
  outstandingLoanBalance: number;

  spendingTrend: SpendingTrend | null;
  anomalies: ExpenseAnomaly[];

  loanOpportunity: LoanOpportunity | null;
}

export interface InsightsDashboardData {
  displayCurrency: AccountCurrency;

  healthScore: FinancialHealthScore;
  insights: FinancialInsight[];

  snapshot: FinancialInsightSnapshot;

  aiEnabled: boolean;
}

export interface FinancialCoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FinancialCoachApiResponse {
  success: boolean;

  answer?: string;
  error?: string;

  remainingRequests?: number;
}
