"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import type { AccountCurrency } from "@/features/accounts/account.types";
import type { LoanScenarioComparison } from "@/features/loans/loan.types";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div>
        <h2 className="font-medium text-white">
          Outstanding balance comparison
        </h2>

        <p className="mt-1 text-sm text-white/35">
          Required-payment balance versus your accelerated scenario.
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="mt-6 min-h-[340px] w-full"
      >
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 8,
            right: 16,
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
            width={90}
            tickFormatter={(value) =>
              formatCurrency(Number(value), currency, {
                compact: true,
                maximumFractionDigits: 1,
              })
            }
          />

          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />

          <ChartTooltip content={<ChartTooltipContent />} />

          <ChartLegend content={<ChartLegendContent />} />

          <Line
            type="monotone"
            dataKey="baselineBalance"
            stroke="var(--color-baselineBalance)"
            strokeWidth={2.25}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="acceleratedBalance"
            stroke="var(--color-acceleratedBalance)"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ChartContainer>

      {maximumPeriods === 240 && (
        <p className="mt-3 text-xs text-white/25">
          The chart is limited to the first 240 future payments.
        </p>
      )}
    </section>
  );
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
