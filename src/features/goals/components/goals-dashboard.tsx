"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Goal,
  Landmark,
  LoaderCircle,
  PiggyBank,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveFinancialGoal,
  deleteFinancialGoal,
  reactivateFinancialGoal,
} from "@/app/(dashboard)/goals/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GoalDialog } from "@/features/goals/components/goal-dialog";
import {
  FINANCIAL_GOAL_TYPE_LABELS,
  type EvaluatedFinancialGoal,
  type GoalsDashboardData,
  type GoalTrackingStatus,
} from "@/features/goals/goal.types";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface GoalsDashboardProps {
  data: GoalsDashboardData;
}

export function GoalsDashboard({ data }: GoalsDashboardProps) {
  return (
    <div className="space-y-7">
      <section
        aria-label="Goal summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          title="Total goal targets"
          value={formatCurrency(
            data.totalTargetInDisplayCurrency,
            data.displayCurrency,
          )}
          description={`${data.activeGoals.length} active ${
            data.activeGoals.length === 1 ? "goal" : "goals"
          }`}
          icon={Target}
          accent="cyan"
        />

        <SummaryCard
          title="Current progress"
          value={formatCurrency(
            data.totalProgressInDisplayCurrency,
            data.displayCurrency,
          )}
          description={`${data.completedCount} completed`}
          icon={PiggyBank}
          accent="emerald"
        />

        <SummaryCard
          title="Monthly allocations"
          value={formatCurrency(
            data.plannedMonthlyAllocations,
            data.displayCurrency,
          )}
          description="Planned across active goals"
          icon={WalletCards}
          accent="violet"
        />

        <SummaryCard
          title="Available after goals"
          value={formatCurrency(data.availableAfterGoals, data.displayCurrency)}
          description="Projected savings after allocations"
          icon={TrendingUp}
          accent={data.availableAfterGoals < 0 ? "red" : "amber"}
          negative={data.availableAfterGoals < 0}
        />
      </section>

      {data.availableAfterGoals < 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-5 py-4 shadow-lg shadow-black/10"
        >
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-red-300"
          />

          <div>
            <p className="text-sm font-semibold text-red-200">
              Goal allocations exceed projected savings
            </p>

            <p className="mt-1 text-sm leading-6 text-red-100/60">
              Your planned monthly goal contributions exceed projected monthly
              savings by{" "}
              <span className="financial-number font-semibold">
                {formatCurrency(
                  Math.abs(data.availableAfterGoals),
                  data.displayCurrency,
                )}
              </span>
              .
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="active-goals-heading" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="active-goals-heading" className="section-title">
              Active goals
            </h2>

            <p className="section-description">
              {data.onTrackCount} on track
              {" · "}
              {data.behindCount} behind
            </p>
          </div>

          <GoalDialog accounts={data.accounts} />
        </div>

        {data.activeGoals.length === 0 ? (
          <EmptyGoalsState accounts={data.accounts} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} accounts={data.accounts} />
            ))}
          </div>
        )}
      </section>

      {data.archivedGoals.length > 0 && (
        <section
          aria-labelledby="archived-goals-heading"
          className="space-y-4 border-t border-white/[0.06] pt-7"
        >
          <div>
            <h2 id="archived-goals-heading" className="section-title">
              Archived goals
            </h2>

            <p className="section-description">
              Archived goals are hidden from active planning totals.
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

function EmptyGoalsState({
  accounts,
}: {
  accounts: GoalsDashboardData["accounts"];
}) {
  return (
    <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center sm:py-20">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
        <Goal aria-hidden="true" className="size-6" />
      </div>

      <h3 className="mt-5 text-base font-semibold tracking-[-0.015em] text-white">
        Create your first financial goal
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/38">
        Track an emergency fund, savings target, custom target, or loan payoff
        plan using your real account balances.
      </p>

      <div className="mt-6 flex justify-center">
        <GoalDialog accounts={accounts} />
      </div>
    </section>
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

  const titleId = `goal-${goal.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        [
          "rounded-2xl border",
          "border-white/[0.07]",
          "bg-white/[0.025]",
          "p-5",
          "shadow-[0_18px_55px_rgba(0,0,0,0.12)]",
          "transition-[border-color,background-color,transform,box-shadow]",
          "duration-200",
          "hover:-translate-y-px",
          "hover:border-white/[0.11]",
          "hover:bg-white/[0.035]",
        ].join(" "),

        goal.status === "archived" && "opacity-75 hover:opacity-100",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
            <Icon aria-hidden="true" className="size-5" />
          </div>

          <div className="min-w-0">
            <h3
              id={titleId}
              title={goal.name}
              className="truncate text-base font-semibold tracking-[-0.015em] text-white"
            >
              {goal.name}
            </h3>

            <p className="mt-1 text-xs text-white/35">
              {FINANCIAL_GOAL_TYPE_LABELS[goal.goalType]}
              {" · "}
              Priority {goal.priority}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/32">Progress</p>

            <p className="financial-number mt-1 truncate text-xl font-semibold text-white">
              {formatCurrency(goal.currentAmount, goal.currency)}
            </p>
          </div>

          <div className="min-w-0 text-right">
            <p className="text-xs font-medium text-white/32">Target</p>

            <p className="financial-number mt-1 truncate text-sm font-semibold text-white/68">
              {formatCurrency(goal.effectiveTargetAmount, goal.currency)}
            </p>
          </div>
        </div>

        <Progress
          value={goal.progressPercent}
          aria-label={`Progress toward ${goal.name}`}
          aria-valuetext={`${goal.progressPercent.toFixed(1)}% complete`}
          className="mt-4"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/35">
          <span className="financial-number">
            {goal.progressPercent.toFixed(1)}%
          </span>

          <span className="financial-number">
            {formatCurrency(goal.remainingAmount, goal.currency)} remaining
          </span>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
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
          numeric={goal.requiredMonthlyContribution !== null}
        />

        <InfoBlock
          label="Planned monthly"
          value={formatCurrency(goal.plannedMonthlyContribution, goal.currency)}
          numeric
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
      </dl>

      {goal.linkedAccountName && (
        <p className="mt-4 text-xs leading-5 text-white/35">
          Linked to{" "}
          <span className="font-medium text-white/58">
            {goal.linkedAccountName}
          </span>
        </p>
      )}

      {goal.notes && (
        <p
          title={goal.notes}
          className="mt-4 line-clamp-2 text-xs leading-5 text-white/35"
        >
          {goal.notes}
        </p>
      )}

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {goal.status === "active" && (
            <GoalDialog accounts={accounts} goal={goal} />
          )}

          <GoalActionButtons goal={goal} />
        </div>
      </div>
    </article>
  );
}

function GoalActionButtons({ goal }: { goal: EvaluatedFinancialGoal }) {
  const router = useRouter();

  const [pendingAction, setPendingAction] = useState<
    "archive" | "reactivate" | null
  >(null);

  const [error, setError] = useState<string | null>(null);

  async function runStatusAction(type: "archive" | "reactivate") {
    setError(null);
    setPendingAction(type);

    try {
      const result =
        type === "archive"
          ? await archiveFinancialGoal(goal.id)
          : await reactivateFinancialGoal(goal.id);

      if (!result.success) {
        const message = result.error ?? "The goal could not be updated.";

        setError(message);
        toast.error(message);
        return;
      }

      toast.success(
        type === "archive"
          ? `"${goal.name}" archived.`
          : `"${goal.name}" reactivated.`,
      );

      router.refresh();
    } catch {
      const message = "FinSight could not update the goal.";

      setError(message);
      toast.error(message);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <>
      {goal.status === "active" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pendingAction !== null}
          onClick={() => {
            void runStatusAction("archive");
          }}
          className="border-white/10 bg-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          {pendingAction === "archive" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Archive className="size-3.5" />
          )}

          {pendingAction === "archive" ? "Archiving..." : "Archive"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pendingAction !== null}
          onClick={() => {
            void runStatusAction("reactivate");
          }}
          className="border-white/10 bg-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          {pendingAction === "reactivate" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <ArchiveRestore className="size-3.5" />
          )}

          {pendingAction === "reactivate" ? "Reactivating..." : "Reactivate"}
        </Button>
      )}

      <DeleteGoalDialog goal={goal} />

      {error && (
        <p
          role="alert"
          className="w-full text-right text-xs leading-5 text-red-300"
        >
          {error}
        </p>
      )}
    </>
  );
}

function DeleteGoalDialog({ goal }: { goal: EvaluatedFinancialGoal }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const result = await deleteFinancialGoal(goal.id);

      if (!result.success) {
        const message = result.error ?? "The goal could not be deleted.";

        setError(message);
        toast.error(message);
        return;
      }

      setOpen(false);

      toast.success(`"${goal.name}" deleted.`);

      router.refresh();
    } catch {
      const message = "FinSight could not delete the goal.";

      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleting) {
          setOpen(nextOpen);

          if (!nextOpen) {
            setError(null);
          }
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Delete ${goal.name}`}
            className="border-red-400/15 bg-transparent text-red-300/70 hover:bg-red-400/10 hover:text-red-200"
          />
        }
      >
        <Trash2 className="size-3.5" />
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="size-5" />
          </AlertDialogMedia>

          <AlertDialogTitle>Delete {goal.name}?</AlertDialogTitle>

          <AlertDialogDescription>
            This permanently removes the financial goal and its planning
            information. Your linked account, transactions, and balances will
            not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div
            role="alert"
            className="mx-6 mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200"
          >
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() => {
              void handleDelete();
            }}
          >
            {deleting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}

            {deleting ? "Deleting goal..." : "Delete goal"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InfoBlock({
  label,
  value,
  icon: Icon,
  numeric = false,
}: {
  label: string;
  value: string;
  icon?: typeof CalendarDays;
  numeric?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-black/10 p-3.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-white/28">
        {Icon && <Icon aria-hidden="true" className="size-3.5" />}

        {label}
      </dt>

      <dd
        className={cn(
          "mt-1.5 break-words text-sm font-semibold text-white/62",

          numeric && "financial-number",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

type SummaryAccent = "cyan" | "emerald" | "violet" | "amber" | "red";

const summaryAccentStyles: Record<
  SummaryAccent,
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

  violet: {
    icon: "border-violet-400/10 bg-violet-400/10 text-violet-300",

    glow: "from-violet-400/[0.08]",
  },

  amber: {
    icon: "border-amber-400/10 bg-amber-400/10 text-amber-300",

    glow: "from-amber-400/[0.08]",
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
  negative = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Target;
  accent: SummaryAccent;
  negative?: boolean;
}) {
  const styles = summaryAccentStyles[accent];

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
            className={cn(
              "financial-number mt-3 truncate text-xl font-semibold",

              negative ? "text-red-300" : "text-white",
            )}
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

    className: "bg-white/[0.06] text-white/38",
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
