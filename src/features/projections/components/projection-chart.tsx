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
import type { ProjectionMonth } from "@/features/projections/projection.types";
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
  closingBalance: {
    label: "Closing balance",
    color: "var(--chart-1)",
  },

  netCashFlow: {
    label: "Monthly savings",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface ProjectionChartProps {
  months: ProjectionMonth[];
  currency: AccountCurrency;
}

export function ProjectionChart({ months, currency }: ProjectionChartProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div>
        <h2 className="font-medium text-white">Projected balance</h2>

        <p className="mt-1 text-sm text-white/35">
          Closing balance and monthly net cash flow in {currency}.
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="mt-6 min-h-[320px] w-full"
      >
        <LineChart
          accessibilityLayer
          data={months}
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
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            width={84}
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
            dataKey="closingBalance"
            stroke="var(--color-closingBalance)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
            }}
          />

          <Line
            type="monotone"
            dataKey="netCashFlow"
            stroke="var(--color-netCashFlow)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </section>
  );
}
