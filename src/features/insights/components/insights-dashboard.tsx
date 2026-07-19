import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  CircleDollarSign,
  Goal,
  Landmark,
  ShieldCheck,
} from "lucide-react";

import { FinancialCoach } from "@/features/insights/components/financial-coach";
import { FinancialHealthScore } from "@/features/insights/components/financial-health-score";
import { InsightCard } from "@/features/insights/components/insight-card";
import type { InsightsDashboardData } from "@/features/insights/insight.types";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface InsightsDashboardProps {
  data: InsightsDashboardData;
}

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  const snapshot = data.snapshot;

  return (
    <div className="space-y-7">
      <FinancialHealthScore healthScore={data.healthScore} />

      <section
        aria-label="Financial intelligence snapshot"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          title="Expected monthly savings"
          value={formatCurrency(
            snapshot.expectedMonthlySavings,
            data.displayCurrency,
          )}
          description={
            snapshot.savingsRatePercent !== null
              ? `${snapshot.savingsRatePercent}% savings rate`
              : "Savings rate unavailable"
          }
          icon={CircleDollarSign}
          accent={snapshot.expectedMonthlySavings >= 0 ? "emerald" : "red"}
        />

        <MetricCard
          title="Emergency coverage"
          value={
            snapshot.emergencyFundMonths !== null
              ? `${snapshot.emergencyFundMonths} months`
              : "Unavailable"
          }
          description="Liquid balance divided by expected monthly outflow"
          icon={ShieldCheck}
          accent={
            snapshot.emergencyFundMonths !== null &&
            snapshot.emergencyFundMonths >= 6
              ? "emerald"
              : "amber"
          }
        />

        <MetricCard
          title="Outstanding loans"
          value={formatCurrency(
            snapshot.outstandingLoanBalance,
            data.displayCurrency,
          )}
          description={`${snapshot.configuredLoanCount} configured for optimization`}
          icon={Landmark}
          accent="violet"
        />

        <MetricCard
          title="Active goals"
          value={String(snapshot.activeGoalCount)}
          description={`${snapshot.onTrackGoalCount} on track · ${snapshot.behindGoalCount} behind`}
          icon={Goal}
          accent={snapshot.behindGoalCount > 0 ? "amber" : "cyan"}
        />
      </section>

      <section
        aria-labelledby="recommended-actions-heading"
        className="space-y-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="recommended-actions-heading" className="section-title">
              Recommended actions
            </h2>

            <p className="section-description">
              Deterministic insights generated from your current FinSight data.
            </p>
          </div>

          <p className="text-xs text-white/28">
            Snapshot generated{" "}
            <time dateTime={snapshot.generatedAt}>
              {formatSnapshotDate(snapshot.generatedAt)}
            </time>
          </p>
        </div>

        {data.insights.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-400/15 bg-emerald-400/[0.03] px-6 py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-white/65">
              No immediate actions detected
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/32">
              FinSight did not identify any current financial issues requiring a
              recommendation.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>

      <FinancialCoach enabled={data.aiEnabled} />

      <aside
        aria-labelledby="financial-intelligence-disclaimer"
        className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/60"
      >
        <h2 id="financial-intelligence-disclaimer" className="sr-only">
          Financial intelligence disclaimer
        </h2>
        FinSight’s health score, anomaly detection, projections, and loan
        calculations are estimates. The AI coach explains those calculations but
        may still produce incorrect or incomplete text. Confirm important
        financial, legal, tax, and investment decisions independently.
      </aside>
    </div>
  );
}

type Accent = "cyan" | "emerald" | "amber" | "violet" | "red";

const accentStyles: Record<
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

function MetricCard({
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
  const styles = accentStyles[accent];

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

function formatSnapshotDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
