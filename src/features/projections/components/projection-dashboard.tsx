"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Landmark,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { ProjectionChart } from "@/features/projections/components/projection-chart";
import { ProjectionControls } from "@/features/projections/components/projection-controls";
import { ProjectionTable } from "@/features/projections/components/projection-table";
import { RecurringScheduleList } from "@/features/projections/components/recurring-schedule-list";
import {
  buildProjection,
  DEFAULT_PROJECTION_ASSUMPTIONS,
} from "@/features/projections/projection-engine";
import type { ProjectionPageData } from "@/features/projections/projection.types";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface ProjectionDashboardProps {
  data: ProjectionPageData;
}

export function ProjectionDashboard({ data }: ProjectionDashboardProps) {
  const [assumptions, setAssumptions] = useState(
    DEFAULT_PROJECTION_ASSUMPTIONS,
  );

  const projection = useMemo(
    () =>
      buildProjection({
        openingBalance: data.openingBalance,

        recurringItems: data.recurringItems,

        assumptions,
      }),
    [assumptions, data.openingBalance, data.recurringItems],
  );

  const projectedSpending =
    projection.summary.totalExpenses + projection.summary.totalLoanPayments;

  const summaryAnnouncement = [
    `Projection updated for ${assumptions.months} months.`,

    `Projected ending balance is ${formatCurrency(
      projection.summary.endingBalance,
      data.displayCurrency,
    )}.`,

    `Average monthly savings is ${formatCurrency(
      projection.summary.averageMonthlySavings,
      data.displayCurrency,
    )}.`,

    projection.summary.negativeBalanceMonth
      ? `The balance first becomes negative in ${projection.summary.negativeBalanceMonth}.`
      : "The projected balance remains non-negative.",
  ].join(" ");

  return (
    <div className="space-y-7">
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {summaryAnnouncement}
      </p>

      <ProjectionControls
        currency={data.displayCurrency}
        assumptions={assumptions}
        onChange={setAssumptions}
        onReset={() => {
          setAssumptions(DEFAULT_PROJECTION_ASSUMPTIONS);
        }}
      />

      {projection.summary.negativeBalanceMonth && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-5 py-4 shadow-lg shadow-black/10"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-red-300"
          />

          <div>
            <p className="text-sm font-semibold text-red-200">
              Projected negative balance
            </p>

            <p className="mt-1 text-sm leading-6 text-red-100/60">
              Your projected cash balance falls below zero in{" "}
              <span className="font-semibold">
                {projection.summary.negativeBalanceMonth}
              </span>
              . The lowest projected balance is{" "}
              <span className="financial-number font-semibold">
                {formatCurrency(
                  projection.summary.lowestBalance,
                  data.displayCurrency,
                )}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      <section
        aria-label="Projection summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <SummaryCard
          title="Current liquid balance"
          value={formatCurrency(data.openingBalance, data.displayCurrency)}
          description="Active bank and cash accounts"
          icon={WalletCards}
          accent="cyan"
        />

        <SummaryCard
          title="Projected ending balance"
          value={formatCurrency(
            projection.summary.endingBalance,
            data.displayCurrency,
          )}
          description={`After ${assumptions.months} months`}
          icon={PiggyBank}
          accent={projection.summary.endingBalance >= 0 ? "emerald" : "red"}
        />

        <SummaryCard
          title="Average monthly savings"
          value={formatCurrency(
            projection.summary.averageMonthlySavings,
            data.displayCurrency,
          )}
          description="Average projected net cash flow"
          icon={TrendingUp}
          accent={
            projection.summary.averageMonthlySavings >= 0 ? "emerald" : "red"
          }
        />

        <SummaryCard
          title="Projected spending"
          value={formatCurrency(projectedSpending, data.displayCurrency)}
          description="Expenses and loan payments"
          icon={TrendingDown}
          accent="amber"
        />

        <SummaryCard
          title="Loan payments"
          value={formatCurrency(
            projection.summary.totalLoanPayments,
            data.displayCurrency,
          )}
          description="Included in total outflow"
          icon={Landmark}
          accent="violet"
        />
      </section>

      <ProjectionChart
        months={projection.months}
        currency={data.displayCurrency}
      />

      <ProjectionTable
        months={projection.months}
        currency={data.displayCurrency}
      />

      <RecurringScheduleList
        items={data.recurringItems}
        displayCurrency={data.displayCurrency}
      />

      <aside className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/60">
        Projection calculations use the latest available reference exchange
        rates dated{" "}
        <time dateTime={data.fxEffectiveDate}>
          {formatDate(data.fxEffectiveDate)}
        </time>
        . Future exchange-rate movements are not predicted.
      </aside>
    </div>
  );
}

type Accent = "cyan" | "emerald" | "amber" | "violet" | "red";

const accentClasses: Record<
  Accent,
  {
    icon: string;
    glow: string;
  }
> = {
  cyan: {
    icon: "border-cyan-400/10 bg-cyan-400/10 text-cyan-300",

    glow: "from-cyan-400/[0.08]",
  },

  emerald: {
    icon: "border-emerald-400/10 bg-emerald-400/10 text-emerald-300",

    glow: "from-emerald-400/[0.08]",
  },

  amber: {
    icon: "border-amber-400/10 bg-amber-400/10 text-amber-300",

    glow: "from-amber-400/[0.08]",
  },

  violet: {
    icon: "border-violet-400/10 bg-violet-400/10 text-violet-300",

    glow: "from-violet-400/[0.08]",
  },

  red: {
    icon: "border-red-400/10 bg-red-400/10 text-red-300",

    glow: "from-red-400/[0.08]",
  },
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accent: Accent;
}) {
  const styles = accentClasses[accent];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.12)] transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:border-white/[0.11] hover:bg-white/[0.035]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          styles.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium text-white/42">{title}</p>

          <p
            title={value}
            className="financial-number mt-3 truncate text-xl font-semibold text-white"
          >
            {value}
          </p>
        </div>

        <div
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            styles.icon,
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="relative mt-3 text-xs leading-5 text-white/32">
        {description}
      </p>
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
