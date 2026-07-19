import type {
  AmortizationRow,
  AmortizationScenario,
  LoanOptimizerAssumptions,
  LoanScenarioComparison,
} from "@/features/loans/loan.types";

export const DEFAULT_LOAN_OPTIMIZER_ASSUMPTIONS: LoanOptimizerAssumptions = {
  additionalMonthlyPayment: 0,
  oneTimePayment: 0,
};

interface BuildAmortizationOptions {
  currentBalance: number;

  annualInterestRate: number;
  requiredMonthlyPayment: number;

  nextPaymentDate: string;

  additionalMonthlyPayment?: number;
  oneTimePayment?: number;

  maximumMonths?: number;
}

export function buildAmortizationScenario({
  currentBalance,
  annualInterestRate,
  requiredMonthlyPayment,
  nextPaymentDate,
  additionalMonthlyPayment = 0,
  oneTimePayment = 0,
  maximumMonths = 600,
}: BuildAmortizationOptions): AmortizationScenario {
  const normalizedBalance = roundMoney(
    Math.max(0, sanitizeNumber(currentBalance)),
  );

  const normalizedRate = Math.max(0, sanitizeNumber(annualInterestRate));

  const normalizedRequiredPayment = roundMoney(
    Math.max(0, sanitizeNumber(requiredMonthlyPayment)),
  );

  const normalizedAdditionalPayment = roundMoney(
    Math.max(0, sanitizeNumber(additionalMonthlyPayment)),
  );

  const normalizedOneTimePayment = roundMoney(
    Math.max(0, sanitizeNumber(oneTimePayment)),
  );

  if (normalizedBalance === 0) {
    return {
      status: "already_paid",

      openingBalance: 0,
      annualInterestRate: normalizedRate,

      requiredMonthlyPayment: normalizedRequiredPayment,

      additionalMonthlyPayment: normalizedAdditionalPayment,

      oneTimePayment: normalizedOneTimePayment,

      monthsToPayoff: 0,
      payoffDate: null,

      totalInterest: 0,
      totalPaid: 0,
      totalPrincipalPaid: 0,

      schedule: [],
    };
  }

  const monthlyInterestRate = normalizedRate / 100 / 12;

  const schedule: AmortizationRow[] = [];

  let runningBalance = normalizedBalance;

  let totalInterest = 0;
  let totalPaid = 0;

  const paymentAnchor = parseIsoDate(nextPaymentDate);

  const safeMaximumMonths = Math.max(
    1,
    Math.min(600, Math.round(sanitizeNumber(maximumMonths))),
  );

  for (let period = 1; period <= safeMaximumMonths; period += 1) {
    const openingBalance = roundMoney(runningBalance);

    const interest = roundMoney(openingBalance * monthlyInterestRate);

    const balanceWithInterest = roundMoney(openingBalance + interest);

    const scheduledPayment = roundMoney(
      Math.min(normalizedRequiredPayment, balanceWithInterest),
    );

    const remainingAfterScheduled = roundMoney(
      Math.max(0, balanceWithInterest - scheduledPayment),
    );

    const requestedMonthlyExtra = normalizedAdditionalPayment;

    const requestedOneTimeExtra = period === 1 ? normalizedOneTimePayment : 0;

    const additionalPayment = roundMoney(
      Math.min(requestedMonthlyExtra, remainingAfterScheduled),
    );

    const remainingAfterMonthlyExtra = roundMoney(
      Math.max(0, remainingAfterScheduled - additionalPayment),
    );

    const appliedOneTimePayment = roundMoney(
      Math.min(requestedOneTimeExtra, remainingAfterMonthlyExtra),
    );

    const totalPayment = roundMoney(
      scheduledPayment + additionalPayment + appliedOneTimePayment,
    );

    const principalPaid = roundMoney(totalPayment - interest);

    const closingBalance = roundMoney(
      Math.max(0, balanceWithInterest - totalPayment),
    );

    schedule.push({
      period,

      paymentDate: toIsoDate(addMonthsClamped(paymentAnchor, period - 1)),

      openingBalance,
      interest,

      scheduledPayment,

      additionalMonthlyPayment: additionalPayment,

      oneTimePayment: appliedOneTimePayment,

      totalPayment,
      principalPaid,

      closingBalance,
    });

    totalInterest = roundMoney(totalInterest + interest);

    totalPaid = roundMoney(totalPaid + totalPayment);

    runningBalance = closingBalance;

    if (closingBalance <= 0) {
      return {
        status: "paid_off",

        openingBalance: normalizedBalance,

        annualInterestRate: normalizedRate,

        requiredMonthlyPayment: normalizedRequiredPayment,

        additionalMonthlyPayment: normalizedAdditionalPayment,

        oneTimePayment: normalizedOneTimePayment,

        monthsToPayoff: schedule.length,

        payoffDate: schedule.at(-1)?.paymentDate ?? null,

        totalInterest,

        totalPaid,

        totalPrincipalPaid: normalizedBalance,

        schedule,
      };
    }
  }

  return {
    status: "not_paid_off",

    openingBalance: normalizedBalance,

    annualInterestRate: normalizedRate,

    requiredMonthlyPayment: normalizedRequiredPayment,

    additionalMonthlyPayment: normalizedAdditionalPayment,

    oneTimePayment: normalizedOneTimePayment,

    monthsToPayoff: null,
    payoffDate: null,

    totalInterest,

    totalPaid,

    totalPrincipalPaid: roundMoney(normalizedBalance - runningBalance),

    schedule,
  };
}

interface BuildComparisonOptions {
  currentBalance: number;

  annualInterestRate: number;
  requiredMonthlyPayment: number;

  nextPaymentDate: string;

  assumptions: LoanOptimizerAssumptions;
}

export function buildLoanScenarioComparison({
  currentBalance,
  annualInterestRate,
  requiredMonthlyPayment,
  nextPaymentDate,
  assumptions,
}: BuildComparisonOptions): LoanScenarioComparison {
  const baseline = buildAmortizationScenario({
    currentBalance,
    annualInterestRate,
    requiredMonthlyPayment,
    nextPaymentDate,

    additionalMonthlyPayment: 0,
    oneTimePayment: 0,
  });

  const accelerated = buildAmortizationScenario({
    currentBalance,
    annualInterestRate,
    requiredMonthlyPayment,
    nextPaymentDate,

    additionalMonthlyPayment: assumptions.additionalMonthlyPayment,

    oneTimePayment: assumptions.oneTimePayment,
  });

  const interestSaved =
    baseline.status === "paid_off" && accelerated.status === "paid_off"
      ? roundMoney(baseline.totalInterest - accelerated.totalInterest)
      : null;

  const monthsSaved =
    baseline.monthsToPayoff !== null && accelerated.monthsToPayoff !== null
      ? Math.max(0, baseline.monthsToPayoff - accelerated.monthsToPayoff)
      : null;

  return {
    baseline,
    accelerated,

    interestSaved,
    monthsSaved,
  };
}

export function calculateMonthlyPaymentForTerm({
  principal,
  annualInterestRate,
  termMonths,
}: {
  principal: number;
  annualInterestRate: number;
  termMonths: number;
}): number {
  const normalizedPrincipal = Math.max(0, sanitizeNumber(principal));

  const normalizedTerm = Math.max(1, Math.round(sanitizeNumber(termMonths)));

  const monthlyRate =
    Math.max(0, sanitizeNumber(annualInterestRate)) / 100 / 12;

  if (monthlyRate === 0) {
    return roundMoney(normalizedPrincipal / normalizedTerm);
  }

  const growthFactor = Math.pow(1 + monthlyRate, normalizedTerm);

  return roundMoney(
    (normalizedPrincipal * (monthlyRate * growthFactor)) / (growthFactor - 1),
  );
}

function addMonthsClamped(anchorDate: Date, monthOffset: number): Date {
  const rawTargetMonth = anchorDate.getUTCMonth() + monthOffset;

  const targetYear =
    anchorDate.getUTCFullYear() + Math.floor(rawTargetMonth / 12);

  const targetMonth = ((rawTargetMonth % 12) + 12) % 12;

  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();

  const targetDay = Math.min(anchorDate.getUTCDate(), daysInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

function parseIsoDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("The next-payment date is invalid.");
  }

  return parsed;
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sanitizeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
