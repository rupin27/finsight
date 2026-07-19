import type {
  FinancialHealthScore,
  HealthScoreComponent,
  HealthScoreGrade,
} from "@/features/insights/insight.types";

interface CalculateHealthScoreOptions {
  expectedMonthlyIncome: number;
  expectedMonthlyOutflow: number;
  expectedMonthlySavings: number;

  emergencyFundMonths: number | null;
  debtPaymentRatioPercent: number | null;

  activeGoalCount: number;
  completedGoalCount: number;
  onTrackGoalCount: number;

  projectedNegativeBalanceMonthIndex: number | null;
}

export function calculateFinancialHealthScore({
  expectedMonthlyIncome,
  expectedMonthlyOutflow,
  expectedMonthlySavings,
  emergencyFundMonths,
  debtPaymentRatioPercent,
  activeGoalCount,
  completedGoalCount,
  onTrackGoalCount,
  projectedNegativeBalanceMonthIndex,
}: CalculateHealthScoreOptions): FinancialHealthScore {
  const savingsRate =
    expectedMonthlyIncome > 0
      ? expectedMonthlySavings / expectedMonthlyIncome
      : null;

  const savingsComponent = calculateSavingsRateComponent(savingsRate);

  const emergencyComponent =
    calculateEmergencyFundComponent(emergencyFundMonths);

  const debtComponent = calculateDebtBurdenComponent({
    expectedMonthlyIncome,
    expectedMonthlyOutflow,
    debtPaymentRatioPercent,
  });

  const goalComponent = calculateGoalComponent({
    activeGoalCount,
    completedGoalCount,
    onTrackGoalCount,
  });

  const riskComponent = calculateCashFlowRiskComponent({
    expectedMonthlySavings,
    projectedNegativeBalanceMonthIndex,
  });

  const components = [
    savingsComponent,
    emergencyComponent,
    debtComponent,
    goalComponent,
    riskComponent,
  ];

  const score = Math.round(
    components.reduce((total, component) => total + component.score, 0),
  );

  return {
    score,
    maximumScore: 100,
    grade: getHealthGrade(score),
    components,
  };
}

function calculateSavingsRateComponent(
  savingsRate: number | null,
): HealthScoreComponent {
  const maximumScore = 25;

  if (savingsRate === null) {
    return {
      key: "savings_rate",
      label: "Savings rate",
      score: 0,
      maximumScore,
      summary:
        "No positive monthly income is available for calculating a savings rate.",
    };
  }

  const score =
    savingsRate <= 0
      ? 0
      : clamp((savingsRate / 0.2) * maximumScore, 0, maximumScore);

  return {
    key: "savings_rate",
    label: "Savings rate",
    score,
    maximumScore,
    summary:
      savingsRate >= 0.2
        ? "Expected savings are at least 20% of monthly income."
        : `Expected savings are ${formatPercent(
            savingsRate * 100,
          )} of monthly income.`,
  };
}

function calculateEmergencyFundComponent(
  emergencyFundMonths: number | null,
): HealthScoreComponent {
  const maximumScore = 20;

  if (emergencyFundMonths === null) {
    return {
      key: "emergency_fund",
      label: "Emergency coverage",
      score: 0,
      maximumScore,
      summary:
        "Monthly expenses are unavailable, so emergency coverage cannot be calculated.",
    };
  }

  const score = clamp(
    (emergencyFundMonths / 6) * maximumScore,
    0,
    maximumScore,
  );

  return {
    key: "emergency_fund",
    label: "Emergency coverage",
    score,
    maximumScore,
    summary: `${formatNumber(
      emergencyFundMonths,
    )} months of expected outflow are covered by liquid balances.`,
  };
}

function calculateDebtBurdenComponent({
  expectedMonthlyIncome,
  expectedMonthlyOutflow,
  debtPaymentRatioPercent,
}: {
  expectedMonthlyIncome: number;
  expectedMonthlyOutflow: number;
  debtPaymentRatioPercent: number | null;
}): HealthScoreComponent {
  const maximumScore = 20;

  if (debtPaymentRatioPercent === null) {
    const noIncomeWithOutflow =
      expectedMonthlyIncome <= 0 && expectedMonthlyOutflow > 0;

    return {
      key: "debt_burden",
      label: "Debt-payment burden",
      score: noIncomeWithOutflow ? 0 : maximumScore,
      maximumScore,
      summary: noIncomeWithOutflow
        ? "Debt burden cannot be supported by the currently expected income."
        : "No recurring debt-payment burden was detected.",
    };
  }

  let score: number;

  if (debtPaymentRatioPercent <= 10) {
    score = maximumScore;
  } else if (debtPaymentRatioPercent >= 50) {
    score = 0;
  } else {
    score = ((50 - debtPaymentRatioPercent) / 40) * maximumScore;
  }

  return {
    key: "debt_burden",
    label: "Debt-payment burden",
    score,
    maximumScore,
    summary: `${formatPercent(
      debtPaymentRatioPercent,
    )} of expected monthly income is allocated to loan payments.`,
  };
}

function calculateGoalComponent({
  activeGoalCount,
  completedGoalCount,
  onTrackGoalCount,
}: {
  activeGoalCount: number;
  completedGoalCount: number;
  onTrackGoalCount: number;
}): HealthScoreComponent {
  const maximumScore = 20;

  if (activeGoalCount === 0) {
    return {
      key: "goal_health",
      label: "Goal health",
      score: 15,
      maximumScore,
      summary:
        "No active goals are configured. This receives a neutral score rather than a penalty.",
    };
  }

  const healthyGoalCount = completedGoalCount + onTrackGoalCount;

  const score = clamp(
    (healthyGoalCount / activeGoalCount) * maximumScore,
    0,
    maximumScore,
  );

  return {
    key: "goal_health",
    label: "Goal health",
    score,
    maximumScore,
    summary: `${healthyGoalCount} of ${activeGoalCount} active goals are completed or on track.`,
  };
}

function calculateCashFlowRiskComponent({
  expectedMonthlySavings,
  projectedNegativeBalanceMonthIndex,
}: {
  expectedMonthlySavings: number;

  projectedNegativeBalanceMonthIndex: number | null;
}): HealthScoreComponent {
  const maximumScore = 15;

  if (projectedNegativeBalanceMonthIndex === null) {
    return {
      key: "cash_flow_risk",
      label: "Cash-flow risk",
      score: expectedMonthlySavings >= 0 ? maximumScore : 8,
      maximumScore,
      summary:
        expectedMonthlySavings >= 0
          ? "The 12-month projection remains positive with non-negative monthly savings."
          : "The balance remains positive, but expected monthly cash flow is negative.",
    };
  }

  if (projectedNegativeBalanceMonthIndex <= 2) {
    return {
      key: "cash_flow_risk",
      label: "Cash-flow risk",
      score: 0,
      maximumScore,
      summary: "The projected balance becomes negative within three months.",
    };
  }

  if (projectedNegativeBalanceMonthIndex <= 5) {
    return {
      key: "cash_flow_risk",
      label: "Cash-flow risk",
      score: 5,
      maximumScore,
      summary: "The projected balance becomes negative within six months.",
    };
  }

  return {
    key: "cash_flow_risk",
    label: "Cash-flow risk",
    score: 10,
    maximumScore,
    summary:
      "The projected balance becomes negative later in the 12-month forecast.",
  };
}

function getHealthGrade(score: number): HealthScoreGrade {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Good";
  }

  if (score >= 55) {
    return "Fair";
  }

  return "Needs attention";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
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
