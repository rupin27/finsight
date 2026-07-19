"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AccountCurrency } from "@/features/accounts/account.types";
import type { LoanScenarioComparison } from "@/features/loans/loan.types";
import { formatCurrency } from "@/lib/finance/currency";

const chartConfig = {
  baselineBalance: {
    label: "Required payment",
    color: "var(--chart-1)",
  },

  acceleratedBalance: {
    label: "Accelerated payoff",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface LoanPayoffChartProps {
  comparison: LoanScenarioComparison;

  currency: AccountCurrency;
}

export function LoanPayoffChart({
  comparison,
  currency,
}: LoanPayoffChartProps) {
  const maximumPeriods = Math.min(
    240,
    Math.max(
      comparison.baseline.schedule.length,

      comparison.accelerated.schedule.length,
    ),
  );

  const chartData = Array.from(
    {
      length: maximumPeriods,
    },

    (_, index) => {
      const baselineRow = comparison.baseline.schedule[index];

      const acceleratedRow = comparison.accelerated.schedule[index];

      const paymentDate =
        baselineRow?.paymentDate ?? acceleratedRow?.paymentDate ?? "";

      return {
        period: index + 1,

        label: formatChartMonth(paymentDate),

        baselineBalance: baselineRow?.closingBalance ?? 0,

        acceleratedBalance: acceleratedRow?.closingBalance ?? 0,
      };
    },
  );

  const summary = buildChartSummary(comparison, currency);

  return (
    <section
      aria-labelledby="loan-payoff-chart-title"
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <div>
        <h2 id="loan-payoff-chart-title" className="section-title">
          Outstanding balance comparison
        </h2>

        <p className="section-description">
          Required-payment balance versus your accelerated scenario.
        </p>
      </div>

      <p id="loan-payoff-chart-summary" className="sr-only">
        {summary}
      </p>

      {chartData.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-white/38">
          No future balance path is available because the loan is already paid
          off.
        </div>
      ) : (
        <div
          role="img"
          aria-labelledby="loan-payoff-chart-title"
          aria-describedby="loan-payoff-chart-summary"
        >
          <ChartContainer
            config={chartConfig}
            className="mt-6 min-h-[300px] w-full sm:min-h-[340px]"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 4,
                right: 12,
                top: 8,
                bottom: 4,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={32}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={82}
                tickFormatter={(value) =>
                  formatCurrency(Number(value), currency, {
                    compact: true,
                    maximumFractionDigits: 1,
                  })
                }
              />

              <ReferenceLine
                y={0}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />

              <ChartTooltip content={<ChartTooltipContent />} />

              <ChartLegend content={<ChartLegendContent />} />

              <Line
                type="monotone"
                dataKey="baselineBalance"
                stroke="var(--color-baselineBalance)"
                strokeWidth={2.25}
                dot={false}
                activeDot={{
                  r: 4,
                }}
              />

              <Line
                type="monotone"
                dataKey="acceleratedBalance"
                stroke="var(--color-acceleratedBalance)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}

      {maximumPeriods === 240 && (
        <p className="mt-3 text-xs leading-5 text-white/28">
          The visual chart is limited to the first 240 future payments. The
          payoff calculations still use the complete generated schedule.
        </p>
      )}
    </section>
  );
}

function buildChartSummary(
  comparison: LoanScenarioComparison,

  currency: AccountCurrency,
): string {
  const baseline = comparison.baseline;

  const accelerated = comparison.accelerated;

  const parts = [
    `The starting loan balance is ${formatCurrency(
      baseline.openingBalance,
      currency,
    )}.`,
  ];

  if (baseline.monthsToPayoff !== null) {
    parts.push(
      `Required payments repay the loan in ${baseline.monthsToPayoff} months.`,
    );
  } else {
    parts.push(
      "Required payments do not repay the loan within the modeled period.",
    );
  }

  if (accelerated.monthsToPayoff !== null) {
    parts.push(
      `The accelerated scenario repays the loan in ${accelerated.monthsToPayoff} months.`,
    );
  }

  if (comparison.interestSaved !== null) {
    parts.push(
      `Estimated interest saved is ${formatCurrency(
        comparison.interestSaved,
        currency,
      )}.`,
    );
  }

  return parts.join(" ");
}

function formatChartMonth(value: string): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
