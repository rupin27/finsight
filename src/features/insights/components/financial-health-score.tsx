import { Activity, BadgeCheck } from "lucide-react";

import type { FinancialHealthScore as FinancialHealthScoreData } from "@/features/insights/insight.types";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FinancialHealthScoreProps {
  healthScore: FinancialHealthScoreData;
}

export function FinancialHealthScore({
  healthScore,
}: FinancialHealthScoreProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-300" />

            <h2 className="font-medium text-white">Financial health score</h2>
          </div>

          <p className="mt-2 max-w-xl text-sm leading-6 text-white/35">
            A transparent score based on savings, emergency coverage, debt
            burden, goal progress, and projected cash-flow risk.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-4xl font-semibold tracking-tight text-white">
              {healthScore.score}
              <span className="text-lg text-white/25">/100</span>
            </p>

            <p
              className={cn(
                "mt-1 text-sm font-medium",
                getGradeClassName(healthScore.score),
              )}
            >
              {healthScore.grade}
            </p>
          </div>

          <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <BadgeCheck className="size-6" />
          </div>
        </div>
      </div>

      <Progress value={healthScore.score} className="mt-6" />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {healthScore.components.map((component) => (
          <article
            key={component.key}
            className="rounded-xl border border-white/[0.06] bg-black/10 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-white/45">
                {component.label}
              </p>

              <span className="text-xs text-white/30">
                {Math.round(component.score)}/{component.maximumScore}
              </span>
            </div>

            <Progress
              value={(component.score / component.maximumScore) * 100}
              className="mt-3"
            />

            <p className="mt-3 text-xs leading-5 text-white/28">
              {component.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function getGradeClassName(score: number): string {
  if (score >= 85) {
    return "text-emerald-300";
  }

  if (score >= 70) {
    return "text-cyan-300";
  }

  if (score >= 55) {
    return "text-amber-300";
  }

  return "text-red-300";
}
