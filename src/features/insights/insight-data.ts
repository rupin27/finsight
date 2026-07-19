import { getAccounts } from "@/features/accounts/account-data";
import type { AccountCurrency } from "@/features/accounts/account.types";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import { getGoalsDashboardData } from "@/features/goals/goal-data";
import { calculateFinancialHealthScore } from "@/features/insights/health-score";
import { generateFinancialInsights } from "@/features/insights/insight-engine";
import type {
  ExpenseAnomaly,
  FinancialInsightSnapshot,
  InsightsDashboardData,
  LoanOpportunity,
  SpendingTrend,
} from "@/features/insights/insight.types";
import { buildLoanScenarioComparison } from "@/features/loans/loan-amortization";
import { getLoanDashboardData } from "@/features/loans/loan-data";
import {
  buildProjection,
  DEFAULT_PROJECTION_ASSUMPTIONS,
} from "@/features/projections/projection-engine";
import { getProjectionPageData } from "@/features/projections/projection-data";
import {
  getMonthlyTransactionSummary,
  getTransactionCategories,
} from "@/features/transactions/transaction-data";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";
import {
  convertAmount,
  convertCurrencyTotals,
  roundCurrencyAmount,
} from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";
import { getUserPreferences } from "@/features/settings/user-preferences";

export async function getInsightsDashboardData(): Promise<InsightsDashboardData> {
  const [
    accounts,
    displayCurrency,
    projectionData,
    goalsData,
    loanData,
    monthlySummary,
    categories,
    preferences,
  ] = await Promise.all([
    getAccounts(),
    getUserDefaultCurrency(),
    getProjectionPageData(),
    getGoalsDashboardData(),
    getLoanDashboardData(),
    getMonthlyTransactionSummary(),
    getTransactionCategories(),
    getUserPreferences(),
  ]);

  const fxSnapshot = await getExchangeRateSnapshot(displayCurrency);

  const projection = buildProjection({
    openingBalance: projectionData.openingBalance,

    recurringItems: projectionData.recurringItems,

    assumptions: {
      ...DEFAULT_PROJECTION_ASSUMPTIONS,
      months: 12,
    },
  });

  const currentIncome = convertCurrencyTotals(
    monthlySummary.incomeTotals,
    displayCurrency,
    fxSnapshot,
  );

  const currentSpending = convertCurrencyTotals(
    monthlySummary.spendingTotals,
    displayCurrency,
    fxSnapshot,
  );

  const hasRecurringForecast = projectionData.recurringItems.length > 0;

  const firstProjectionMonth = projection.months[0];

  const expectedMonthlyIncome =
    hasRecurringForecast && firstProjectionMonth
      ? firstProjectionMonth.income
      : currentIncome;

  const expectedMonthlyOutflow =
    hasRecurringForecast && firstProjectionMonth
      ? firstProjectionMonth.totalOutflow
      : currentSpending;

  const expectedMonthlySavings = expectedMonthlyIncome - expectedMonthlyOutflow;

  const expectedMonthlyLoanPayments =
    hasRecurringForecast && firstProjectionMonth
      ? firstProjectionMonth.loanPayments
      : 0;

  const liquidBalance = projectionData.openingBalance;

  const emergencyFundMonths =
    expectedMonthlyOutflow > 0 ? liquidBalance / expectedMonthlyOutflow : null;

  const savingsRatePercent =
    expectedMonthlyIncome > 0
      ? (expectedMonthlySavings / expectedMonthlyIncome) * 100
      : null;

  const debtPaymentRatioPercent =
    expectedMonthlyIncome > 0
      ? (expectedMonthlyLoanPayments / expectedMonthlyIncome) * 100
      : expectedMonthlyLoanPayments > 0
        ? null
        : 0;

  const negativeMonthIndex = projection.months.findIndex(
    (month) => month.closingBalance < 0,
  );

  const projectedNegativeBalanceMonth =
    negativeMonthIndex >= 0
      ? projection.months[negativeMonthIndex].label
      : null;

  const { spendingTrend, anomalies } = await getSpendingAnalysis({
    displayCurrency,
    categories,
    fxSnapshot,
  });

  const loanOpportunity = getBestLoanOpportunity({
    displayCurrency,
    loanData,
    fxSnapshot,
  });

  const snapshot: FinancialInsightSnapshot = {
    generatedAt: new Date().toISOString(),

    displayCurrency,

    liquidBalance: roundCurrencyAmount(liquidBalance),

    expectedMonthlyIncome: roundCurrencyAmount(expectedMonthlyIncome),

    expectedMonthlyOutflow: roundCurrencyAmount(expectedMonthlyOutflow),

    expectedMonthlySavings: roundCurrencyAmount(expectedMonthlySavings),

    savingsRatePercent:
      savingsRatePercent === null ? null : roundOneDecimal(savingsRatePercent),

    emergencyFundMonths:
      emergencyFundMonths === null
        ? null
        : roundOneDecimal(emergencyFundMonths),

    debtPaymentRatioPercent:
      debtPaymentRatioPercent === null
        ? null
        : roundOneDecimal(debtPaymentRatioPercent),

    projectedEndingBalance12Months: roundCurrencyAmount(
      projection.summary.endingBalance,
    ),

    projectedNegativeBalanceMonth,

    activeGoalCount: goalsData.activeGoals.length,

    completedGoalCount: goalsData.completedCount,

    onTrackGoalCount: goalsData.onTrackCount,

    behindGoalCount: goalsData.behindCount,

    plannedMonthlyGoalAllocations: goalsData.plannedMonthlyAllocations,

    availableAfterGoalAllocations: goalsData.availableAfterGoals,

    configuredLoanCount: loanData.loans.filter((loan) => loan.profile).length,

    outstandingLoanBalance: loanData.totalBalanceInDisplayCurrency,

    spendingTrend,
    anomalies,

    loanOpportunity,
  };

  const healthScore = calculateFinancialHealthScore({
    expectedMonthlyIncome: snapshot.expectedMonthlyIncome,

    expectedMonthlyOutflow: snapshot.expectedMonthlyOutflow,

    expectedMonthlySavings: snapshot.expectedMonthlySavings,

    emergencyFundMonths: snapshot.emergencyFundMonths,

    debtPaymentRatioPercent: snapshot.debtPaymentRatioPercent,

    activeGoalCount: snapshot.activeGoalCount,

    completedGoalCount: snapshot.completedGoalCount,

    onTrackGoalCount: snapshot.onTrackGoalCount,

    projectedNegativeBalanceMonthIndex:
      negativeMonthIndex >= 0 ? negativeMonthIndex : null,
  });

  return {
    displayCurrency,

    healthScore,

    insights: generateFinancialInsights(snapshot),

    snapshot,

    aiEnabled: Boolean(
      preferences.aiEnabled &&
      preferences.aiContextMode === "aggregated" &&
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_MODEL,
    ),
  };
}

interface SpendingAnalysisOptions {
  displayCurrency: AccountCurrency;

  categories: Array<{
    id: string;
    name: string;
  }>;

  fxSnapshot: Awaited<ReturnType<typeof getExchangeRateSnapshot>>;
}

async function getSpendingAnalysis({
  displayCurrency,
  categories,
  fxSnapshot,
}: SpendingAnalysisOptions): Promise<{
  spendingTrend: SpendingTrend | null;
  anomalies: ExpenseAnomaly[];
}> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const currentMonthStart = getFirstDayOfCurrentMonth();

  const rangeStart = addMonths(currentMonthStart, -4);

  const todayExclusive = addDays(new Date(), 1);

  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
          id,
          amount,
          currency,
          transaction_date,
          description,
          category_id
        `,
    )
    .eq("user_id", userId)
    .eq("transaction_kind", "expense")
    .gte("transaction_date", toIsoDate(rangeStart))
    .lt("transaction_date", toIsoDate(todayExclusive))
    .order("transaction_date", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Unable to analyze spending history: ${error.message}`);
  }

  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const normalizedExpenses = (data ?? []).map((row) => {
    const currency = row.currency as AccountCurrency;

    return {
      transactionId: String(row.id),

      transactionDate: String(row.transaction_date),

      description: String(row.description),

      categoryName:
        typeof row.category_id === "string"
          ? (categoryMap.get(row.category_id) ?? "Uncategorized")
          : "Uncategorized",

      amount: convertAmount(
        Number(row.amount ?? 0),
        currency,
        displayCurrency,
        fxSnapshot,
      ),
    };
  });

  return {
    spendingTrend: calculateSpendingTrend({
      expenses: normalizedExpenses,

      currentMonthStart,
    }),

    anomalies: detectExpenseAnomalies(normalizedExpenses),
  };
}

function calculateSpendingTrend({
  expenses,
  currentMonthStart,
}: {
  expenses: Array<{
    transactionDate: string;
    categoryName: string;
    amount: number;
  }>;

  currentMonthStart: Date;
}): SpendingTrend {
  const lastCompletedMonth = addMonths(currentMonthStart, -1);

  const monthKeys = [
    addMonths(currentMonthStart, -4),
    addMonths(currentMonthStart, -3),
    addMonths(currentMonthStart, -2),
    lastCompletedMonth,
  ].map(toMonthKey);

  const monthlyTotals = new Map<string, number>(
    monthKeys.map((key) => [key, 0]),
  );

  const lastMonthCategories = new Map<string, number>();

  const lastMonthKey = toMonthKey(lastCompletedMonth);

  for (const expense of expenses) {
    const monthKey = expense.transactionDate.slice(0, 7);

    if (!monthlyTotals.has(monthKey)) {
      continue;
    }

    monthlyTotals.set(
      monthKey,
      (monthlyTotals.get(monthKey) ?? 0) + expense.amount,
    );

    if (monthKey === lastMonthKey) {
      lastMonthCategories.set(
        expense.categoryName,
        (lastMonthCategories.get(expense.categoryName) ?? 0) + expense.amount,
      );
    }
  }

  const priorMonthKeys = monthKeys.slice(0, 3);

  const priorAverage =
    priorMonthKeys.reduce(
      (total, key) => total + (monthlyTotals.get(key) ?? 0),
      0,
    ) / priorMonthKeys.length;

  const lastMonthSpending = monthlyTotals.get(lastMonthKey) ?? 0;

  const changePercent =
    priorAverage > 0
      ? ((lastMonthSpending - priorAverage) / priorAverage) * 100
      : null;

  const topCategory = [...lastMonthCategories.entries()].sort(
    ([, leftAmount], [, rightAmount]) => rightAmount - leftAmount,
  )[0];

  return {
    lastCompletedMonth: lastMonthKey,

    lastMonthSpending: roundCurrencyAmount(lastMonthSpending),

    priorThreeMonthAverage: roundCurrencyAmount(priorAverage),

    changePercent:
      changePercent === null ? null : roundOneDecimal(changePercent),

    topCategoryName: topCategory?.[0] ?? null,

    topCategoryAmount: roundCurrencyAmount(topCategory?.[1] ?? 0),
  };
}

function detectExpenseAnomalies(
  expenses: Array<{
    transactionId: string;
    transactionDate: string;
    description: string;
    categoryName: string;
    amount: number;
  }>,
): ExpenseAnomaly[] {
  const recentExpenses = expenses.filter(
    (expense) => expense.transactionDate >= getDaysAgoIso(90),
  );

  if (recentExpenses.length < 5) {
    return [];
  }

  const amounts = recentExpenses
    .map((expense) => expense.amount)
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  if (amounts.length < 5) {
    return [];
  }

  const amountMedian = median(amounts);

  const absoluteDeviations = amounts.map((amount) =>
    Math.abs(amount - amountMedian),
  );

  const medianAbsoluteDeviation = median(absoluteDeviations);

  return recentExpenses
    .map((expense) => {
      let robustZScore: number | null = null;

      let isAnomaly = false;

      if (medianAbsoluteDeviation > 0) {
        robustZScore =
          (0.6745 * (expense.amount - amountMedian)) / medianAbsoluteDeviation;

        isAnomaly = robustZScore > 3.5;
      } else {
        isAnomaly = amountMedian > 0 && expense.amount > amountMedian * 2;
      }

      return {
        expense,
        robustZScore,
        isAnomaly,
      };
    })
    .filter((result) => result.isAnomaly)
    .sort((left, right) => right.expense.amount - left.expense.amount)
    .slice(0, 3)
    .map(({ expense, robustZScore }) => ({
      transactionId: expense.transactionId,

      transactionDate: expense.transactionDate,

      description: expense.description,

      categoryName: expense.categoryName,

      amount: roundCurrencyAmount(expense.amount),

      robustZScore:
        robustZScore === null ? null : roundOneDecimal(robustZScore),
    }));
}

function getBestLoanOpportunity({
  displayCurrency,
  loanData,
  fxSnapshot,
}: {
  displayCurrency: AccountCurrency;

  loanData: Awaited<ReturnType<typeof getLoanDashboardData>>;

  fxSnapshot: Awaited<ReturnType<typeof getExchangeRateSnapshot>>;
}): LoanOpportunity | null {
  const opportunities: LoanOpportunity[] = [];

  for (const loan of loanData.loans) {
    if (!loan.profile || loan.currentBalance <= 0) {
      continue;
    }

    const suggestedAdditionalPayment = roundCurrencyAmount(
      loan.profile.requiredMonthlyPayment * 0.1,
    );

    const comparison = buildLoanScenarioComparison({
      currentBalance: loan.currentBalance,

      annualInterestRate: loan.profile.annualInterestRate,

      requiredMonthlyPayment: loan.profile.requiredMonthlyPayment,

      nextPaymentDate: loan.profile.nextPaymentDate,

      assumptions: {
        additionalMonthlyPayment: suggestedAdditionalPayment,

        oneTimePayment: 0,
      },
    });

    if (
      comparison.interestSaved === null ||
      comparison.monthsSaved === null ||
      comparison.interestSaved <= 0 ||
      comparison.monthsSaved <= 0
    ) {
      continue;
    }

    opportunities.push({
      accountId: loan.accountId,

      accountName: loan.accountName,

      currency: loan.currency,

      suggestedAdditionalPayment,

      suggestedAdditionalPaymentInDisplayCurrency: roundCurrencyAmount(
        convertAmount(
          suggestedAdditionalPayment,
          loan.currency,
          displayCurrency,
          fxSnapshot,
        ),
      ),

      interestSaved: comparison.interestSaved,

      interestSavedInDisplayCurrency: roundCurrencyAmount(
        convertAmount(
          comparison.interestSaved,
          loan.currency,
          displayCurrency,
          fxSnapshot,
        ),
      ),

      monthsSaved: comparison.monthsSaved,
    });
  }

  return (
    opportunities.sort(
      (left, right) =>
        right.interestSavedInDisplayCurrency -
        left.interestSavedInDisplayCurrency,
    )[0] ?? null
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function getFirstDayOfCurrentMonth(): Date {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function addMonths(date: Date, monthOffset: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthOffset, 1),
  );
}

function addDays(date: Date, dayOffset: number): Date {
  const result = new Date(date);

  result.setUTCDate(result.getUTCDate() + dayOffset);

  return result;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toMonthKey(date: Date): string {
  return toIsoDate(date).slice(0, 7);
}

function getDaysAgoIso(days: number): string {
  const date = new Date();

  date.setUTCDate(date.getUTCDate() - days);

  return toIsoDate(date);
}

function roundOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}
