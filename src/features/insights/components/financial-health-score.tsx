import { Activity, BadgeCheck } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { FinancialHealthScore as FinancialHealthScoreData } from "@/features/insights/insight.types";
import { cn } from "@/lib/utils";

interface FinancialHealthScoreProps {
  healthScore: FinancialHealthScoreData;
}

export function FinancialHealthScore({
  healthScore,
}: FinancialHealthScoreProps) {
  return (
    <section
      aria-labelledby="financial-health-score-heading"
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.12)] sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity aria-hidden="true" className="size-4 text-cyan-300" />

            <h2 id="financial-health-score-heading" className="section-title">
              Financial health score
            </h2>
          </div>

          <p className="section-description max-w-xl">
            A transparent score based on savings, emergency coverage, debt
            burden, goal progress, and projected cash-flow risk.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p
              aria-label={`${healthScore.score} out of ${healthScore.maximumScore}`}
              className="financial-number text-4xl font-semibold tracking-[-0.04em] text-white"
            >
              {healthScore.score}

              <span aria-hidden="true" className="text-lg text-white/28">
                /{healthScore.maximumScore}
              </span>
            </p>

            <p
              className={cn(
                "mt-1 text-sm font-semibold",

                getGradeClassName(healthScore.score),
              )}
            >
              {healthScore.grade}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300"
          >
            <BadgeCheck className="size-6" />
          </div>
        </div>
      </div>

      <Progress
        value={healthScore.score}
        aria-label="Overall financial health score"
        aria-valuetext={`${healthScore.score} out of ${healthScore.maximumScore}, graded ${healthScore.grade}`}
        className="mt-6"
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {healthScore.components.map((component) => {
          const percentage =
            component.maximumScore > 0
              ? (component.score / component.maximumScore) * 100
              : 0;

          const roundedScore = Math.round(component.score);

          return (
            <article
              key={component.key}
              className="rounded-xl border border-white/[0.06] bg-black/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xs font-semibold leading-5 text-white/48">
                  {component.label}
                </h3>

                <span className="financial-number shrink-0 text-xs font-medium text-white/32">
                  {roundedScore}/{component.maximumScore}
                </span>
              </div>

              <Progress
                value={percentage}
                aria-label={`${component.label} score`}
                aria-valuetext={`${roundedScore} out of ${component.maximumScore}`}
                className="mt-3"
              />

              <p className="mt-3 text-xs leading-5 text-white/32">
                {component.summary}
              </p>
            </article>
          );
        })}
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
