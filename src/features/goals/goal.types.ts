import type {
  Account,
  AccountCurrency,
} from "@/features/accounts/account.types";

export const FINANCIAL_GOAL_TYPES = [
  "savings",
  "emergency_fund",
  "loan_payoff",
  "custom",
] as const;

export const GOAL_PROGRESS_SOURCES = ["manual", "linked_account"] as const;

export type FinancialGoalType = (typeof FINANCIAL_GOAL_TYPES)[number];

export type GoalProgressSource = (typeof GOAL_PROGRESS_SOURCES)[number];

export type GoalRecordStatus = "active" | "archived";

export type GoalTrackingStatus =
  | "completed"
  | "on_track"
  | "behind"
  | "no_plan"
  | "no_target_date"
  | "archived";

export interface FinancialGoalRecord {
  id: string;
  name: string;

  goalType: FinancialGoalType;
  progressSource: GoalProgressSource;

  targetAmount: number | null;
  manualCurrentAmount: number;

  currency: AccountCurrency;
  targetDate: string | null;

  linkedAccountId: string | null;
  baselineAmount: number | null;

  plannedMonthlyContribution: number;
  emergencyFundMonths: number | null;

  priority: number;
  status: GoalRecordStatus;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface EvaluatedFinancialGoal extends FinancialGoalRecord {
  linkedAccountName: string | null;

  effectiveTargetAmount: number;
  currentAmount: number;
  remainingAmount: number;

  progressPercent: number;

  requiredMonthlyContribution: number | null;

  projectedCompletionDate: string | null;

  trackingStatus: GoalTrackingStatus;
}

export interface GoalsDashboardData {
  displayCurrency: AccountCurrency;

  activeGoals: EvaluatedFinancialGoal[];
  archivedGoals: EvaluatedFinancialGoal[];

  totalTargetInDisplayCurrency: number;
  totalProgressInDisplayCurrency: number;

  projectedMonthlySavings: number;
  plannedMonthlyAllocations: number;
  availableAfterGoals: number;

  completedCount: number;
  onTrackCount: number;
  behindCount: number;

  accounts: Account[];
}

export const FINANCIAL_GOAL_TYPE_LABELS: Record<FinancialGoalType, string> = {
  savings: "Savings",
  emergency_fund: "Emergency fund",
  loan_payoff: "Loan payoff",
  custom: "Custom goal",
};
