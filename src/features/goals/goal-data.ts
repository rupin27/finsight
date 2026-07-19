import { getAccounts } from "@/features/accounts/account-data";
import type {
  Account,
  AccountCurrency,
} from "@/features/accounts/account.types";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import type {
  EvaluatedFinancialGoal,
  FinancialGoalRecord,
  FinancialGoalType,
  GoalProgressSource,
  GoalsDashboardData,
  GoalTrackingStatus,
} from "@/features/goals/goal.types";
import {
  buildAmortizationScenario,
  calculateMonthlyPaymentForTerm,
} from "@/features/loans/loan-amortization";
import { getLoanDashboardData } from "@/features/loans/loan-data";
import {
  buildProjection,
  DEFAULT_PROJECTION_ASSUMPTIONS,
} from "@/features/projections/projection-engine";
import { getProjectionPageData } from "@/features/projections/projection-data";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import {
  convertAmount,
  roundCurrencyAmount,
} from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";

export async function getGoalsDashboardData(): Promise<GoalsDashboardData> {
  const [accounts, displayCurrency, projectionData, loanData] =
    await Promise.all([
      getAccounts(),
      getUserDefaultCurrency(),
      getProjectionPageData(),
      getLoanDashboardData(),
    ]);

  const fxSnapshot = await getExchangeRateSnapshot(displayCurrency);

  const projection = buildProjection({
    openingBalance: projectionData.openingBalance,

    recurringItems: projectionData.recurringItems,

    assumptions: DEFAULT_PROJECTION_ASSUMPTIONS,
  });

  const projectionMonthCount = Math.max(1, projection.months.length);

  const averageMonthlyOutflow =
    (projection.summary.totalExpenses + projection.summary.totalLoanPayments) /
    projectionMonthCount;

  const projectedMonthlySavings = projection.summary.averageMonthlySavings;

  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("financial_goal_plans")
    .select(
      `
        id,
        name,
        goal_type,
        progress_source,
        target_amount,
        manual_current_amount,
        currency,
        target_date,
        linked_account_id,
        baseline_amount,
        planned_monthly_contribution,
        emergency_fund_months,
        priority,
        status,
        notes,
        created_at,
        updated_at
      `,
    )
    .eq("user_id", userId)
    .order("priority", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Unable to load financial goals: ${error.message}`);
  }

  const accountMap = new Map<string, Account>(
    accounts.map((account) => [account.id, account]),
  );

  const loanMap = new Map(loanData.loans.map((loan) => [loan.accountId, loan]));

  const goals = (data ?? []).map(mapGoalRecord);

  const evaluatedGoals = goals.map((goal) =>
    evaluateGoal({
      goal,
      accountMap,
      loanMap,

      displayCurrency,
      fxSnapshot,

      averageMonthlyOutflow,
    }),
  );

  const activeGoals = evaluatedGoals.filter((goal) => goal.status === "active");

  const archivedGoals = evaluatedGoals.filter(
    (goal) => goal.status === "archived",
  );

  const totalTargetInDisplayCurrency = activeGoals.reduce(
    (total, goal) =>
      total +
      convertAmount(
        goal.effectiveTargetAmount,
        goal.currency,
        displayCurrency,
        fxSnapshot,
      ),
    0,
  );

  const totalProgressInDisplayCurrency = activeGoals.reduce(
    (total, goal) =>
      total +
      convertAmount(
        goal.currentAmount,
        goal.currency,
        displayCurrency,
        fxSnapshot,
      ),
    0,
  );

  const plannedMonthlyAllocations = activeGoals.reduce(
    (total, goal) =>
      total +
      convertAmount(
        goal.plannedMonthlyContribution,
        goal.currency,
        displayCurrency,
        fxSnapshot,
      ),
    0,
  );

  return {
    displayCurrency,

    activeGoals,
    archivedGoals,

    totalTargetInDisplayCurrency: roundCurrencyAmount(
      totalTargetInDisplayCurrency,
    ),

    totalProgressInDisplayCurrency: roundCurrencyAmount(
      totalProgressInDisplayCurrency,
    ),

    projectedMonthlySavings: roundCurrencyAmount(projectedMonthlySavings),

    plannedMonthlyAllocations: roundCurrencyAmount(plannedMonthlyAllocations),

    availableAfterGoals: roundCurrencyAmount(
      projectedMonthlySavings - plannedMonthlyAllocations,
    ),

    completedCount: activeGoals.filter(
      (goal) => goal.trackingStatus === "completed",
    ).length,

    onTrackCount: activeGoals.filter(
      (goal) => goal.trackingStatus === "on_track",
    ).length,

    behindCount: activeGoals.filter((goal) => goal.trackingStatus === "behind")
      .length,

    accounts,
  };
}

function evaluateGoal({
  goal,
  accountMap,
  loanMap,
  displayCurrency,
  fxSnapshot,
  averageMonthlyOutflow,
}: {
  goal: FinancialGoalRecord;

  accountMap: Map<string, Account>;

  loanMap: Map<
    string,
    Awaited<ReturnType<typeof getLoanDashboardData>>["loans"][number]
  >;

  displayCurrency: AccountCurrency;

  fxSnapshot: Awaited<ReturnType<typeof getExchangeRateSnapshot>>;

  averageMonthlyOutflow: number;
}): EvaluatedFinancialGoal {
  const linkedAccount = goal.linkedAccountId
    ? accountMap.get(goal.linkedAccountId)
    : undefined;

  const linkedBalanceInGoalCurrency = linkedAccount
    ? convertAmount(
        Math.max(0, linkedAccount.currentBalance),
        linkedAccount.currency,
        goal.currency,
        fxSnapshot,
      )
    : 0;

  let effectiveTargetAmount = 0;
  let currentAmount = 0;

  if (goal.goalType === "emergency_fund") {
    effectiveTargetAmount =
      convertAmount(
        averageMonthlyOutflow,
        displayCurrency,
        goal.currency,
        fxSnapshot,
      ) * Math.max(1, goal.emergencyFundMonths ?? 1);
  } else if (goal.goalType === "loan_payoff") {
    effectiveTargetAmount = goal.baselineAmount ?? linkedBalanceInGoalCurrency;

    currentAmount = Math.max(
      0,
      effectiveTargetAmount - linkedBalanceInGoalCurrency,
    );
  } else {
    effectiveTargetAmount = goal.targetAmount ?? 0;
  }

  if (goal.goalType !== "loan_payoff") {
    currentAmount =
      goal.progressSource === "linked_account"
        ? linkedBalanceInGoalCurrency
        : goal.manualCurrentAmount;
  }

  effectiveTargetAmount = roundCurrencyAmount(
    Math.max(0, effectiveTargetAmount),
  );

  currentAmount = roundCurrencyAmount(
    Math.max(0, Math.min(currentAmount, effectiveTargetAmount)),
  );

  const remainingAmount = roundCurrencyAmount(
    Math.max(0, effectiveTargetAmount - currentAmount),
  );

  const progressPercent =
    effectiveTargetAmount > 0
      ? Math.min(
          100,
          Math.max(0, (currentAmount / effectiveTargetAmount) * 100),
        )
      : 0;

  const requiredMonthlyContribution = calculateRequiredMonthlyContribution({
    goal,
    remainingAmount,
    linkedBalanceInGoalCurrency,
    loanMap,
    fxSnapshot,
  });

  const projectedCompletionDate = calculateProjectedCompletionDate({
    goal,
    remainingAmount,
    linkedBalanceInGoalCurrency,
    loanMap,
    fxSnapshot,
  });

  const trackingStatus = calculateTrackingStatus({
    recordStatus: goal.status,

    remainingAmount,
    targetDate: goal.targetDate,

    projectedCompletionDate,
  });

  return {
    ...goal,

    linkedAccountName: linkedAccount?.name ?? null,

    effectiveTargetAmount,
    currentAmount,
    remainingAmount,

    progressPercent,

    requiredMonthlyContribution,
    projectedCompletionDate,
    trackingStatus,
  };
}

function calculateRequiredMonthlyContribution({
  goal,
  remainingAmount,
  linkedBalanceInGoalCurrency,
  loanMap,
  fxSnapshot,
}: {
  goal: FinancialGoalRecord;
  remainingAmount: number;

  linkedBalanceInGoalCurrency: number;

  loanMap: Map<
    string,
    Awaited<ReturnType<typeof getLoanDashboardData>>["loans"][number]
  >;

  fxSnapshot: Awaited<ReturnType<typeof getExchangeRateSnapshot>>;
}): number | null {
  if (remainingAmount <= 0 || !goal.targetDate) {
    return remainingAmount <= 0 ? 0 : null;
  }

  const months = getMonthsUntilTarget(goal.targetDate);

  if (months <= 0) {
    return remainingAmount;
  }

  if (goal.goalType !== "loan_payoff") {
    return roundCurrencyAmount(remainingAmount / months);
  }

  if (!goal.linkedAccountId) {
    return null;
  }

  const loan = loanMap.get(goal.linkedAccountId);

  if (!loan?.profile) {
    return null;
  }

  const requiredTotalPayment = calculateMonthlyPaymentForTerm({
    principal: linkedBalanceInGoalCurrency,

    annualInterestRate: loan.profile.annualInterestRate,

    termMonths: months,
  });

  const requiredPaymentInGoalCurrency = convertAmount(
    loan.profile.requiredMonthlyPayment,
    loan.currency,
    goal.currency,
    fxSnapshot,
  );

  return roundCurrencyAmount(
    Math.max(0, requiredTotalPayment - requiredPaymentInGoalCurrency),
  );
}

function calculateProjectedCompletionDate({
  goal,
  remainingAmount,
  linkedBalanceInGoalCurrency,
  loanMap,
  fxSnapshot,
}: {
  goal: FinancialGoalRecord;
  remainingAmount: number;
  linkedBalanceInGoalCurrency: number;

  loanMap: Map<
    string,
    Awaited<ReturnType<typeof getLoanDashboardData>>["loans"][number]
  >;

  fxSnapshot: Awaited<ReturnType<typeof getExchangeRateSnapshot>>;
}): string | null {
  if (remainingAmount <= 0) {
    return getTodayIso();
  }

  if (goal.goalType === "loan_payoff" && goal.linkedAccountId) {
    const loan = loanMap.get(goal.linkedAccountId);

    if (!loan?.profile) {
      return null;
    }

    const requiredPaymentInGoalCurrency = convertAmount(
      loan.profile.requiredMonthlyPayment,
      loan.currency,
      goal.currency,
      fxSnapshot,
    );

    const scenario = buildAmortizationScenario({
      currentBalance: linkedBalanceInGoalCurrency,

      annualInterestRate: loan.profile.annualInterestRate,

      requiredMonthlyPayment: requiredPaymentInGoalCurrency,

      nextPaymentDate: loan.profile.nextPaymentDate,

      additionalMonthlyPayment: goal.plannedMonthlyContribution,
    });

    return scenario.payoffDate;
  }

  if (goal.plannedMonthlyContribution <= 0) {
    return null;
  }

  const requiredMonths = Math.ceil(
    remainingAmount / goal.plannedMonthlyContribution,
  );

  return addMonthsToNextMonth(requiredMonths - 1);
}

function calculateTrackingStatus({
  recordStatus,
  remainingAmount,
  targetDate,
  projectedCompletionDate,
}: {
  recordStatus: FinancialGoalRecord["status"];

  remainingAmount: number;
  targetDate: string | null;

  projectedCompletionDate: string | null;
}): GoalTrackingStatus {
  if (recordStatus === "archived") {
    return "archived";
  }

  if (remainingAmount <= 0) {
    return "completed";
  }

  if (!targetDate) {
    return "no_target_date";
  }

  if (!projectedCompletionDate) {
    return "no_plan";
  }

  return projectedCompletionDate <= targetDate ? "on_track" : "behind";
}

function mapGoalRecord(row: Record<string, unknown>): FinancialGoalRecord {
  return {
    id: String(row.id),

    name: String(row.name),

    goalType: row.goal_type as FinancialGoalType,

    progressSource: row.progress_source as GoalProgressSource,

    targetAmount: row.target_amount === null ? null : Number(row.target_amount),

    manualCurrentAmount: Number(row.manual_current_amount ?? 0),

    currency: row.currency as AccountCurrency,

    targetDate: typeof row.target_date === "string" ? row.target_date : null,

    linkedAccountId:
      typeof row.linked_account_id === "string" ? row.linked_account_id : null,

    baselineAmount:
      row.baseline_amount === null ? null : Number(row.baseline_amount),

    plannedMonthlyContribution: Number(row.planned_monthly_contribution ?? 0),

    emergencyFundMonths:
      row.emergency_fund_months === null
        ? null
        : Number(row.emergency_fund_months),

    priority: Number(row.priority ?? 3),

    status: row.status as FinancialGoalRecord["status"],

    notes: typeof row.notes === "string" ? row.notes : null,

    createdAt: String(row.created_at),

    updatedAt: String(row.updated_at),
  };
}

function getMonthsUntilTarget(targetDate: string): number {
  const now = new Date();

  const firstProjectionMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const target = new Date(`${targetDate}T00:00:00Z`);

  return (
    (target.getUTCFullYear() - firstProjectionMonth.getUTCFullYear()) * 12 +
    (target.getUTCMonth() - firstProjectionMonth.getUTCMonth()) +
    1
  );
}

function addMonthsToNextMonth(monthOffset: number): string {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1 + Math.max(0, monthOffset),
      1,
    ),
  )
    .toISOString()
    .slice(0, 10);
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
