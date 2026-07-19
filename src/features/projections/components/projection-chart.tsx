"use client";

import { useId } from "react";
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
import type { ProjectionMonth } from "@/features/projections/projection.types";
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
  const titleId = useId();

  const summaryId = useId();

  const chartSummary = buildChartSummary(months, currency);

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <div>
        <h2 id={titleId} className="section-title">
          Projected balance
        </h2>

        <p className="section-description">
          Closing balance and monthly net cash flow in {currency}.
        </p>
      </div>

      <p id={summaryId} className="sr-only">
        {chartSummary}
      </p>

      {months.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/10 px-5 py-12 text-center">
          <p className="text-sm font-medium text-white/55">
            No projection data
          </p>

          <p className="mt-1 text-xs leading-5 text-white/30">
            Projection months will appear here once a forecast is generated.
          </p>
        </div>
      ) : (
        <div role="img" aria-labelledby={titleId} aria-describedby={summaryId}>
          <ChartContainer
            config={chartConfig}
            className="mt-6 min-h-[300px] w-full sm:min-h-[340px]"
          >
            <LineChart
              accessibilityLayer
              data={months}
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
                minTickGap={28}
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
                activeDot={{
                  r: 4,
                }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}

function buildChartSummary(
  months: ProjectionMonth[],
  currency: AccountCurrency,
): string {
  if (months.length === 0) {
    return "No projection months are available.";
  }

  const firstMonth = months[0];

  const lastMonth = months[months.length - 1];

  const lowestMonth = months.reduce(
    (lowest, month) =>
      month.closingBalance < lowest.closingBalance ? month : lowest,
    months[0],
  );

  const firstNegativeMonth = months.find((month) => month.closingBalance < 0);

  const statements = [
    `The forecast starts with ${formatCurrency(
      firstMonth.openingBalance,
      currency,
    )}.`,

    `The projected balance after ${months.length} months is ${formatCurrency(
      lastMonth.closingBalance,
      currency,
    )}.`,

    `The lowest projected closing balance is ${formatCurrency(
      lowestMonth.closingBalance,
      currency,
    )} in ${lowestMonth.label}.`,
  ];

  if (firstNegativeMonth) {
    statements.push(
      `The projected closing balance first becomes negative in ${firstNegativeMonth.label}.`,
    );
  } else {
    statements.push(
      "The projected closing balance remains non-negative throughout the forecast.",
    );
  }

  return statements.join(" ");
}
