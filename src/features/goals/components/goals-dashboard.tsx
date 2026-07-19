"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Goal,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  archiveFinancialGoal,
  deleteFinancialGoal,
  reactivateFinancialGoal,
} from "@/app/(dashboard)/goals/actions";
import type {
  EvaluatedFinancialGoal,
  GoalsDashboardData,
  GoalTrackingStatus,
} from "@/features/goals/goal.types";
import { FINANCIAL_GOAL_TYPE_LABELS } from "@/features/goals/goal.types";
import { GoalDialog } from "@/features/goals/components/goal-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface GoalsDashboardProps {
  data: GoalsDashboardData;
}

export function GoalsDashboard({ data }: GoalsDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total goal targets"
          value={formatCurrency(
            data.totalTargetInDisplayCurrency,
            data.displayCurrency,
          )}
          description={`${data.activeGoals.length} active goals`}
          icon={Target}
        />

        <SummaryCard
          title="Current progress"
          value={formatCurrency(
            data.totalProgressInDisplayCurrency,
            data.displayCurrency,
          )}
          description={`${data.completedCount} completed`}
          icon={PiggyBank}
        />

        <SummaryCard
          title="Monthly allocations"
          value={formatCurrency(
            data.plannedMonthlyAllocations,
            data.displayCurrency,
          )}
          description="Planned across active goals"
          icon={WalletCards}
        />

        <SummaryCard
          title="Available after goals"
          value={formatCurrency(data.availableAfterGoals, data.displayCurrency)}
          description="Projected monthly savings minus allocations"
          icon={TrendingUp}
          negative={data.availableAfterGoals < 0}
        />
      </section>

      {data.availableAfterGoals < 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-5 py-4">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-300" />

          <div>
            <p className="text-sm font-medium text-red-200">
              Goal allocations exceed projected savings
            </p>

            <p className="mt-1 text-sm leading-6 text-red-100/55">
              Your planned monthly goal contributions exceed projected monthly
              savings by{" "}
              {formatCurrency(
                Math.abs(data.availableAfterGoals),
                data.displayCurrency,
              )}
              .
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">Active goals</h2>

          <p className="mt-1 text-sm text-white/35">
            {data.onTrackCount} on track · {data.behindCount} behind
          </p>
        </div>

        <GoalDialog accounts={data.accounts} />
      </div>

      {data.activeGoals.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-cyan-400/10">
            <Goal className="size-6 text-cyan-300" />
          </div>

          <h2 className="mt-5 font-medium text-white">
            Create your first financial goal
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
            Track an emergency fund, savings target, custom target, or loan
            payoff.
          </p>

          <div className="mt-6 flex justify-center">
            <GoalDialog accounts={data.accounts} />
          </div>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {data.activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} accounts={data.accounts} />
          ))}
        </section>
      )}

      {data.archivedGoals.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-white">Archived goals</h2>

            <p className="mt-1 text-sm text-white/30">
              Hidden from active planning totals.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {data.archivedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} accounts={data.accounts} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  accounts,
}: {
  goal: EvaluatedFinancialGoal;
  accounts: GoalsDashboardData["accounts"];
}) {
  const status = goalStatusPresentation[goal.trackingStatus];

  const Icon =
    goal.goalType === "loan_payoff"
      ? Landmark
      : goal.goalType === "emergency_fund"
        ? ShieldCheck
        : PiggyBank;

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Icon className="size-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-medium text-white">{goal.name}</h3>

            <p className="mt-1 text-xs text-white/30">
              {FINANCIAL_GOAL_TYPE_LABELS[goal.goalType]}
              {" · "}
              Priority {goal.priority}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-white/30">Progress</p>

            <p className="mt-1 text-xl font-semibold text-white">
              {formatCurrency(goal.currentAmount, goal.currency)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-white/30">Target</p>

            <p className="mt-1 text-sm font-medium text-white/65">
              {formatCurrency(goal.effectiveTargetAmount, goal.currency)}
            </p>
          </div>
        </div>

        <Progress value={goal.progressPercent} className="mt-4" />

        <div className="mt-2 flex items-center justify-between text-xs text-white/30">
          <span>{goal.progressPercent.toFixed(1)}%</span>

          <span>
            {formatCurrency(goal.remainingAmount, goal.currency)} remaining
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoBlock
          label={
            goal.goalType === "loan_payoff"
              ? "Extra needed monthly"
              : "Required monthly"
          }
          value={
            goal.requiredMonthlyContribution !== null
              ? formatCurrency(goal.requiredMonthlyContribution, goal.currency)
              : "No target date"
          }
        />

        <InfoBlock
          label="Planned monthly"
          value={formatCurrency(goal.plannedMonthlyContribution, goal.currency)}
        />

        <InfoBlock
          label="Target date"
          value={goal.targetDate ? formatDate(goal.targetDate) : "Not set"}
          icon={CalendarDays}
        />

        <InfoBlock
          label="Estimated completion"
          value={
            goal.projectedCompletionDate
              ? formatDate(goal.projectedCompletionDate)
              : "No estimate"
          }
          icon={CheckCircle2}
        />
      </div>

      {goal.linkedAccountName && (
        <p className="mt-4 text-xs text-white/30">
          Linked to{" "}
          <span className="text-white/50">{goal.linkedAccountName}</span>
        </p>
      )}

      {goal.notes && (
        <p className="mt-4 line-clamp-2 text-xs leading-5 text-white/30">
          {goal.notes}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] pt-4">
        {goal.status === "active" && (
          <GoalDialog accounts={accounts} goal={goal} />
        )}

        <GoalActionButtons goal={goal} />
      </div>
    </article>
  );
}

function GoalActionButtons({ goal }: { goal: EvaluatedFinancialGoal }) {
  const [error, setError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();

  function runAction(
    action: () => Promise<{
      success: boolean;
      error?: string;
    }>,
  ) {
    setError(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.error ?? "The goal could not be updated.");
      }
    });
  }

  return (
    <>
      {goal.status === "active" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            runAction(() => archiveFinancialGoal(goal.id));
          }}
          className="border-white/10 bg-transparent text-white/45 hover:bg-white/[0.06]"
        >
          <Archive className="size-3.5" />
          Archive
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            runAction(() => reactivateFinancialGoal(goal.id));
          }}
          className="border-white/10 bg-transparent text-white/45 hover:bg-white/[0.06]"
        >
          <ArchiveRestore className="size-3.5" />
          Reactivate
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          const confirmed = window.confirm(
            `Delete "${goal.name}" permanently?`,
          );

          if (confirmed) {
            runAction(() => deleteFinancialGoal(goal.id));
          }
        }}
        className="border-red-400/15 bg-transparent text-red-300/70 hover:bg-red-400/10 hover:text-red-200"
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>

      {error && (
        <p className="w-full text-right text-xs text-red-300">{error}</p>
      )}
    </>
  );
}

function InfoBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof CalendarDays;
}) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-black/10 p-3">
      <p className="flex items-center gap-1.5 text-xs text-white/25">
        {Icon && <Icon className="size-3" />}

        {label}
      </p>

      <p className="mt-1.5 text-sm font-medium text-white/60">{value}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  negative = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Target;
  negative?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/40">{title}</p>

          <p
            className={cn(
              "mt-3 text-xl font-semibold",
              negative ? "text-red-300" : "text-white",
            )}
          >
            {value}
          </p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/30">{description}</p>
    </article>
  );
}

const goalStatusPresentation: Record<
  GoalTrackingStatus,
  {
    label: string;
    className: string;
  }
> = {
  completed: {
    label: "Completed",
    className: "bg-emerald-400/10 text-emerald-300",
  },

  on_track: {
    label: "On track",
    className: "bg-cyan-400/10 text-cyan-300",
  },

  behind: {
    label: "Behind",
    className: "bg-red-400/10 text-red-300",
  },

  no_plan: {
    label: "No contribution plan",
    className: "bg-amber-400/10 text-amber-300",
  },

  no_target_date: {
    label: "No target date",
    className: "bg-white/[0.06] text-white/45",
  },

  archived: {
    label: "Archived",
    className: "bg-white/[0.06] text-white/35",
  },
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
