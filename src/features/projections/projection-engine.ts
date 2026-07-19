import type {
  ProjectionAssumptions,
  ProjectionMonth,
  ProjectionResult,
  RecurringProjectionItem,
} from "@/features/projections/projection.types";
import type { RecurrenceFrequency } from "@/features/transactions/transaction.types";

export const DEFAULT_PROJECTION_ASSUMPTIONS: ProjectionAssumptions = {
  months: 6,

  additionalMonthlyIncome: 0,
  additionalMonthlyExpenses: 0,

  annualIncomeGrowthPercent: 0,
  annualExpenseInflationPercent: 0,
};

interface BuildProjectionOptions {
  openingBalance: number;
  recurringItems: RecurringProjectionItem[];
  assumptions: ProjectionAssumptions;
  now?: Date;
}

export function buildProjection({
  openingBalance,
  recurringItems,
  assumptions,
  now = new Date(),
}: BuildProjectionOptions): ProjectionResult {
  const normalizedAssumptions = normalizeAssumptions(assumptions);

  const projectionStart = getFirstDayOfNextMonth(now);

  const projectionMonths: ProjectionMonth[] = [];

  let runningBalance = sanitizeNumber(openingBalance);

  for (
    let monthIndex = 0;
    monthIndex < normalizedAssumptions.months;
    monthIndex += 1
  ) {
    const monthStart = addMonths(projectionStart, monthIndex);

    const monthEnd = addMonths(projectionStart, monthIndex + 1);

    const incomeGrowthFactor = calculateAnnualGrowthFactor(
      normalizedAssumptions.annualIncomeGrowthPercent,
      monthIndex,
    );

    const expenseGrowthFactor = calculateAnnualGrowthFactor(
      normalizedAssumptions.annualExpenseInflationPercent,
      monthIndex,
    );

    let income =
      normalizedAssumptions.additionalMonthlyIncome * incomeGrowthFactor;

    let expenses =
      normalizedAssumptions.additionalMonthlyExpenses * expenseGrowthFactor;

    let loanPayments = 0;

    for (const item of recurringItems) {
      const occurrenceCount = countOccurrencesInRange(
        item.recurrenceStartDate,
        item.recurrenceEndDate,
        item.recurrenceFrequency,
        monthStart,
        monthEnd,
      );

      if (occurrenceCount === 0) {
        continue;
      }

      const monthlyAmount = item.amountInDisplayCurrency * occurrenceCount;

      if (item.transactionKind === "income") {
        income += monthlyAmount * incomeGrowthFactor;
      } else if (item.transactionKind === "loan_payment") {
        loanPayments += monthlyAmount * expenseGrowthFactor;
      } else {
        expenses += monthlyAmount * expenseGrowthFactor;
      }
    }

    const totalOutflow = expenses + loanPayments;

    const netCashFlow = income - totalOutflow;

    const openingMonthBalance = runningBalance;

    const closingBalance = openingMonthBalance + netCashFlow;

    projectionMonths.push({
      index: monthIndex,

      key: toIsoDate(monthStart).slice(0, 7),

      label: formatMonthLabel(monthStart),

      startDate: toIsoDate(monthStart),

      endDate: toIsoDate(addDays(monthEnd, -1)),

      openingBalance: openingMonthBalance,

      income,
      expenses,
      loanPayments,
      totalOutflow,

      netCashFlow,
      closingBalance,
    });

    runningBalance = closingBalance;
  }

  const totalIncome = projectionMonths.reduce(
    (total, month) => total + month.income,
    0,
  );

  const totalExpenses = projectionMonths.reduce(
    (total, month) => total + month.expenses,
    0,
  );

  const totalLoanPayments = projectionMonths.reduce(
    (total, month) => total + month.loanPayments,
    0,
  );

  const totalNetCashFlow = projectionMonths.reduce(
    (total, month) => total + month.netCashFlow,
    0,
  );

  const lowestBalance = Math.min(
    runningBalance,
    sanitizeNumber(openingBalance),
    ...projectionMonths.map((month) => month.closingBalance),
  );

  const negativeBalanceMonth =
    projectionMonths.find((month) => month.closingBalance < 0)?.label ?? null;

  return {
    startDate: toIsoDate(projectionStart),

    endDate: projectionMonths.at(-1)?.endDate ?? toIsoDate(projectionStart),

    assumptions: normalizedAssumptions,

    months: projectionMonths,

    summary: {
      endingBalance:
        projectionMonths.at(-1)?.closingBalance ??
        sanitizeNumber(openingBalance),

      totalIncome,
      totalExpenses,
      totalLoanPayments,

      averageMonthlySavings:
        projectionMonths.length > 0
          ? totalNetCashFlow / projectionMonths.length
          : 0,

      lowestBalance,
      negativeBalanceMonth,
    },
  };
}

function countOccurrencesInRange(
  recurrenceStartDate: string,
  recurrenceEndDate: string | null,
  frequency: RecurrenceFrequency,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  const anchorDate = parseIsoDate(recurrenceStartDate);

  const scheduleEnd = recurrenceEndDate
    ? parseIsoDate(recurrenceEndDate)
    : null;

  let count = 0;

  for (
    let occurrenceIndex = 0;
    occurrenceIndex < 20_000;
    occurrenceIndex += 1
  ) {
    const occurrenceDate = getOccurrenceDate(
      anchorDate,
      frequency,
      occurrenceIndex,
    );

    if (scheduleEnd && occurrenceDate > scheduleEnd) {
      break;
    }

    if (occurrenceDate >= rangeEnd) {
      break;
    }

    if (occurrenceDate >= rangeStart) {
      count += 1;
    }
  }

  return count;
}

function getOccurrenceDate(
  anchorDate: Date,
  frequency: RecurrenceFrequency,
  occurrenceIndex: number,
): Date {
  if (frequency === "weekly") {
    return addDays(anchorDate, occurrenceIndex * 7);
  }

  if (frequency === "biweekly") {
    return addDays(anchorDate, occurrenceIndex * 14);
  }

  if (frequency === "monthly") {
    return addMonthsClamped(anchorDate, occurrenceIndex);
  }

  if (frequency === "quarterly") {
    return addMonthsClamped(anchorDate, occurrenceIndex * 3);
  }

  return addMonthsClamped(anchorDate, occurrenceIndex * 12);
}

function addMonthsClamped(anchorDate: Date, monthOffset: number): Date {
  const targetMonthIndex = anchorDate.getUTCMonth() + monthOffset;

  const targetYear =
    anchorDate.getUTCFullYear() + Math.floor(targetMonthIndex / 12);

  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();

  const targetDay = Math.min(anchorDate.getUTCDate(), daysInTargetMonth);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

function calculateAnnualGrowthFactor(
  annualPercent: number,
  monthIndex: number,
): number {
  const normalizedRate = Math.max(-100, Math.min(1_000, annualPercent));

  return Math.pow(1 + normalizedRate / 100, monthIndex / 12);
}

function normalizeAssumptions(
  assumptions: ProjectionAssumptions,
): ProjectionAssumptions {
  return {
    months: Math.max(
      1,
      Math.min(24, Math.round(sanitizeNumber(assumptions.months))),
    ),

    additionalMonthlyIncome: Math.max(
      0,
      sanitizeNumber(assumptions.additionalMonthlyIncome),
    ),

    additionalMonthlyExpenses: Math.max(
      0,
      sanitizeNumber(assumptions.additionalMonthlyExpenses),
    ),

    annualIncomeGrowthPercent: sanitizeNumber(
      assumptions.annualIncomeGrowthPercent,
    ),

    annualExpenseInflationPercent: sanitizeNumber(
      assumptions.annualExpenseInflationPercent,
    ),
  };
}

function getFirstDayOfNextMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1));
}

function addMonths(value: Date, months: number): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1),
  );
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);

  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatMonthLabel(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function sanitizeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
