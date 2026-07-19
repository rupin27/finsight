import type {
  ExpenseAnomaly,
  FinancialInsight,
  FinancialInsightSnapshot,
} from "@/features/insights/insight.types";
import { formatCurrency } from "@/lib/finance/currency";

const severityPriority: Record<FinancialInsight["severity"], number> = {
  critical: 0,
  warning: 1,
  positive: 2,
  info: 3,
};

export function generateFinancialInsights(
  snapshot: FinancialInsightSnapshot,
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  addCashFlowInsights(insights, snapshot);

  addSavingsInsights(insights, snapshot);

  addEmergencyFundInsights(insights, snapshot);

  addGoalInsights(insights, snapshot);

  addSpendingInsights(insights, snapshot);

  addLoanInsights(insights, snapshot);

  return insights
    .sort(
      (left, right) =>
        severityPriority[left.severity] - severityPriority[right.severity],
    )
    .slice(0, 10);
}

function addCashFlowInsights(
  insights: FinancialInsight[],
  snapshot: FinancialInsightSnapshot,
) {
  if (snapshot.projectedNegativeBalanceMonth) {
    insights.push({
      id: "negative-balance-risk",

      title: "Projected cash balance becomes negative",

      summary: `FinSight projects a negative balance in ${snapshot.projectedNegativeBalanceMonth}.`,

      detail:
        "Review recurring expenses, planned goal allocations, and expected income before the projected shortfall occurs.",

      severity: "critical",
      category: "cash_flow",

      metric: formatCurrency(
        snapshot.projectedEndingBalance12Months,
        snapshot.displayCurrency,
      ),

      actionLabel: "Review projection",

      actionHref: "/projections",
    });
  } else if (snapshot.expectedMonthlySavings >= 0) {
    insights.push({
      id: "positive-cash-flow",

      title: "Expected monthly cash flow is positive",

      summary: `Expected monthly savings are ${formatCurrency(
        snapshot.expectedMonthlySavings,
        snapshot.displayCurrency,
      )}.`,

      detail:
        "Maintaining this margin provides room for emergency reserves, loan prepayments, and long-term goals.",

      severity: "positive",
      category: "cash_flow",

      actionLabel: "View projection",

      actionHref: "/projections",
    });
  } else {
    insights.push({
      id: "negative-monthly-cash-flow",

      title: "Expected monthly spending exceeds income",

      summary: `Expected monthly cash flow is ${formatCurrency(
        snapshot.expectedMonthlySavings,
        snapshot.displayCurrency,
      )}.`,

      detail:
        "The current liquid balance may delay a shortfall, but recurring spending should be reviewed.",

      severity: "warning",
      category: "cash_flow",

      actionLabel: "Review recurring items",

      actionHref: "/transactions",
    });
  }
}

function addSavingsInsights(
  insights: FinancialInsight[],
  snapshot: FinancialInsightSnapshot,
) {
  const savingsRate = snapshot.savingsRatePercent;

  if (savingsRate === null) {
    insights.push({
      id: "missing-income-data",

      title: "Savings rate cannot be calculated",

      summary:
        "FinSight does not currently have positive recurring income for the next forecast month.",

      detail:
        "Mark salary or regular contract income as recurring to improve the forecast and financial-health score.",

      severity: "info",
      category: "data_quality",

      actionLabel: "Manage transactions",

      actionHref: "/transactions",
    });

    return;
  }

  if (savingsRate < 0) {
    return;
  }

  if (savingsRate < 10) {
    insights.push({
      id: "low-savings-rate",

      title: "Expected savings rate is below 10%",

      summary: `Your expected savings rate is ${formatPercent(savingsRate)}.`,

      detail:
        "A small change to recurring expenses or income could materially improve your financial runway.",

      severity: "warning",
      category: "cash_flow",

      actionLabel: "Test assumptions",

      actionHref: "/projections",
    });
  } else if (savingsRate >= 20) {
    insights.push({
      id: "strong-savings-rate",

      title: "Expected savings rate is strong",

      summary: `Your expected savings rate is ${formatPercent(savingsRate)}.`,

      detail:
        "You may have capacity to accelerate a priority goal or make additional loan payments.",

      severity: "positive",
      category: "cash_flow",

      actionLabel: "Review goals",

      actionHref: "/goals",
    });
  }
}

function addEmergencyFundInsights(
  insights: FinancialInsight[],
  snapshot: FinancialInsightSnapshot,
) {
  const coverage = snapshot.emergencyFundMonths;

  if (coverage === null) {
    return;
  }

  if (coverage < 1) {
    insights.push({
      id: "critical-emergency-fund",

      title: "Liquid reserves cover less than one month",

      summary: `Current liquid balances cover approximately ${formatNumber(
        coverage,
      )} months of expected outflow.`,

      detail:
        "Building a small emergency reserve may be more urgent than optional loan prepayments or lower-priority goals.",

      severity: "critical",
      category: "emergency_fund",

      actionLabel: "Create emergency goal",

      actionHref: "/goals",
    });
  } else if (coverage < 3) {
    insights.push({
      id: "low-emergency-fund",

      title: "Emergency coverage is below three months",

      summary: `Current liquid balances cover approximately ${formatNumber(
        coverage,
      )} months of expected outflow.`,

      detail:
        "Consider directing part of monthly savings toward a dedicated emergency-fund goal.",

      severity: "warning",
      category: "emergency_fund",

      actionLabel: "Review goals",

      actionHref: "/goals",
    });
  } else if (coverage >= 6) {
    insights.push({
      id: "healthy-emergency-fund",

      title: "Liquid reserves provide strong coverage",

      summary: `Current liquid balances cover approximately ${formatNumber(
        coverage,
      )} months of expected outflow.`,

      detail:
        "Your reserve position may provide flexibility for loan prepayments or longer-term goals.",

      severity: "positive",
      category: "emergency_fund",
    });
  }
}

function addGoalInsights(
  insights: FinancialInsight[],
  snapshot: FinancialInsightSnapshot,
) {
  if (snapshot.availableAfterGoalAllocations < 0) {
    insights.push({
      id: "goal-overallocation",

      title: "Goal allocations exceed projected savings",

      summary: `Monthly allocations exceed projected savings by ${formatCurrency(
        Math.abs(snapshot.availableAfterGoalAllocations),
        snapshot.displayCurrency,
      )}.`,

      detail:
        "Reduce one or more planned contributions, extend target dates, or adjust expected income and expenses.",

      severity: "warning",
      category: "goals",

      actionLabel: "Adjust goals",

      actionHref: "/goals",
    });
  }

  if (snapshot.behindGoalCount > 0) {
    insights.push({
      id: "goals-behind",

      title:
        snapshot.behindGoalCount === 1
          ? "One active goal is behind schedule"
          : `${snapshot.behindGoalCount} active goals are behind schedule`,

      summary:
        "Current planned contributions are not sufficient to meet every selected target date.",

      detail:
        "Review required monthly contributions and prioritize the goals with the highest importance.",

      severity: "warning",
      category: "goals",

      actionLabel: "Review goal plans",

      actionHref: "/goals",
    });
  }
}

function addSpendingInsights(
  insights: FinancialInsight[],
  snapshot: FinancialInsightSnapshot,
) {
  const trend = snapshot.spendingTrend;

  if (trend?.changePercent !== null && trend?.changePercent !== undefined) {
    if (trend.changePercent >= 15) {
      insights.push({
        id: "spending-increase",

        title: "Last month’s spending increased",

        summary: `Spending was ${formatPercent(
          trend.changePercent,
        )} above the preceding three-month average.`,

        detail: trend.topCategoryName
          ? `${trend.topCategoryName} was the largest category at ${formatCurrency(
              trend.topCategoryAmount,
              snapshot.displayCurrency,
            )}.`
          : "Review category totals to identify the largest increase.",

        severity: "warning",
        category: "spending",

        actionLabel: "Review transactions",

        actionHref: "/transactions",
      });
    } else if (trend.changePercent <= -10) {
      insights.push({
        id: "spending-decrease",

        title: "Last month’s spending decreased",

        summary: `Spending was ${formatPercent(
          Math.abs(trend.changePercent),
        )} below the preceding three-month average.`,

        detail:
          "Maintaining this reduction could improve savings and goal completion dates.",

        severity: "positive",
        category: "spending",
      });
    }
  }

  const anomaly = getMostSignificantAnomaly(snapshot.anomalies);

  if (anomaly) {
    insights.push({
      id: `expense-anomaly-${anomaly.transactionId}`,

      title: "An unusually large expense was detected",

      summary: `${formatCurrency(
        anomaly.amount,
        snapshot.displayCurrency,
      )} was recorded in ${anomaly.categoryName}.`,

      detail: `${anomaly.description} on ${formatDate(
        anomaly.transactionDate,
      )} was materially larger than your recent typical expense.`,

      severity: "info",
      category: "spending",

      actionLabel: "Review transactions",

      actionHref: "/transactions",
    });
  }
}

function addLoanInsights(
  insights: FinancialInsight[],
  snapshot: FinancialInsightSnapshot,
) {
  const opportunity = snapshot.loanOpportunity;

  if (!opportunity) {
    return;
  }

  insights.push({
    id: `loan-opportunity-${opportunity.accountId}`,

    title: "An illustrative extra payment reduces loan cost",

    summary: `Adding ${formatCurrency(
      opportunity.suggestedAdditionalPaymentInDisplayCurrency,
      snapshot.displayCurrency,
    )} per month could save approximately ${formatCurrency(
      opportunity.interestSavedInDisplayCurrency,
      snapshot.displayCurrency,
    )} in future interest.`,

    detail: `The illustrative scenario shortens the estimated remaining term by ${formatDuration(
      opportunity.monthsSaved,
    )}. It assumes the current interest rate remains unchanged.`,

    severity: "info",
    category: "debt",

    actionLabel: "Open loan optimizer",

    actionHref: "/loans",
  });
}

function getMostSignificantAnomaly(
  anomalies: ExpenseAnomaly[],
): ExpenseAnomaly | null {
  return (
    [...anomalies].sort(
      (left, right) => (right.robustZScore ?? 0) - (left.robustZScore ?? 0),
    )[0] ?? null
  );
}

function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDuration(months: number): string {
  const years = Math.floor(months / 12);

  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  }

  return `${years} ${years === 1 ? "year" : "years"}, ${remainingMonths} ${
    remainingMonths === 1 ? "month" : "months"
  }`;
}
