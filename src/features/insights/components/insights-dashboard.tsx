import {
  Bot,
  CircleDollarSign,
  Goal,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import type { InsightsDashboardData } from "@/features/insights/insight.types";
import { FinancialCoach } from "@/features/insights/components/financial-coach";
import { FinancialHealthScore } from "@/features/insights/components/financial-health-score";
import { InsightCard } from "@/features/insights/components/insight-card";
import { formatCurrency } from "@/lib/finance/currency";

interface InsightsDashboardProps {
  data: InsightsDashboardData;
}

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  const snapshot = data.snapshot;

  return (
    <div className="space-y-6">
      <FinancialHealthScore healthScore={data.healthScore} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          negative={snapshot.expectedMonthlySavings < 0}
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
        />

        <MetricCard
          title="Outstanding loans"
          value={formatCurrency(
            snapshot.outstandingLoanBalance,
            data.displayCurrency,
          )}
          description={`${snapshot.configuredLoanCount} configured for optimization`}
          icon={Landmark}
        />

        <MetricCard
          title="Active goals"
          value={String(snapshot.activeGoalCount)}
          description={`${snapshot.onTrackGoalCount} on track · ${snapshot.behindGoalCount} behind`}
          icon={Goal}
        />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-medium text-white">
            Recommended actions
          </h2>

          <p className="mt-1 text-sm text-white/35">
            Deterministic insights generated from your current FinSight data.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {data.insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      <FinancialCoach enabled={data.aiEnabled} />

      <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/55">
        FinSight’s health score, anomaly detection, projections, and loan
        calculations are estimates. The AI coach explains those calculations but
        may still produce incorrect or incomplete text. Confirm important
        financial, legal, tax, and investment decisions independently.
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  negative = false,
}: {
  title: string;
  value: string;
  description: string;

  icon: typeof WalletCards;

  negative?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white/40">{title}</p>

          <p
            className={
              negative
                ? "mt-3 truncate text-xl font-semibold text-red-300"
                : "mt-3 truncate text-xl font-semibold text-white"
            }
          >
            {value}
          </p>
        </div>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/30">{description}</p>
    </article>
  );
}
