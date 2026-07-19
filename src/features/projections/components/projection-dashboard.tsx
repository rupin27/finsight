"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Landmark,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ProjectionPageData } from "@/features/projections/projection.types";
import {
  buildProjection,
  DEFAULT_PROJECTION_ASSUMPTIONS,
} from "@/features/projections/projection-engine";
import { ProjectionControls } from "@/features/projections/components/projection-controls";
import { ProjectionChart } from "@/features/projections/components/projection-chart";
import { ProjectionTable } from "@/features/projections/components/projection-table";
import { RecurringScheduleList } from "@/features/projections/components/recurring-schedule-list";
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

  return (
    <div className="space-y-6">
      <ProjectionControls
        currency={data.displayCurrency}
        assumptions={assumptions}
        onChange={setAssumptions}
        onReset={() => {
          setAssumptions(DEFAULT_PROJECTION_ASSUMPTIONS);
        }}
      />

      {projection.summary.negativeBalanceMonth && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-5 py-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-300" />

          <div>
            <p className="text-sm font-medium text-red-200">
              Projected negative balance
            </p>

            <p className="mt-1 text-sm leading-6 text-red-100/55">
              Your projected cash balance falls below zero in{" "}
              {projection.summary.negativeBalanceMonth}. Review recurring
              spending or adjust your assumptions.
            </p>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          value={formatCurrency(
            projection.summary.totalExpenses +
              projection.summary.totalLoanPayments,
            data.displayCurrency,
          )}
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

      <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/55">
        Projection calculations use the latest available reference exchange
        rates dated {formatDate(data.fxEffectiveDate)}. Future exchange-rate
        movements are not predicted yet.
      </div>
    </div>
  );
}

type Accent = "cyan" | "emerald" | "amber" | "violet" | "red";

const accentClasses: Record<Accent, string> = {
  cyan: "bg-cyan-400/10 text-cyan-300",
  emerald: "bg-emerald-400/10 text-emerald-300",
  amber: "bg-amber-400/10 text-amber-300",
  violet: "bg-violet-400/10 text-violet-300",
  red: "bg-red-400/10 text-red-300",
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
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white/40">{title}</p>

          <p className="mt-3 truncate text-xl font-semibold text-white">
            {value}
          </p>
        </div>

        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            accentClasses[accent],
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/30">{description}</p>
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
