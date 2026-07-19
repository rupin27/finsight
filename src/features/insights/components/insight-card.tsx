import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Info,
} from "lucide-react";

import type {
  FinancialInsight,
  InsightSeverity,
} from "@/features/insights/insight.types";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: FinancialInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const presentation = severityPresentation[insight.severity];

  const Icon = presentation.icon;

  return (
    <article
      className={cn("rounded-2xl border p-5", presentation.containerClassName)}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            presentation.iconClassName,
          )}
        >
          <Icon className="size-[18px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-medium text-white">{insight.title}</h3>

              <p className="mt-1 text-sm leading-6 text-white/45">
                {insight.summary}
              </p>
            </div>

            {insight.metric && (
              <span className="shrink-0 rounded-lg border border-white/[0.07] bg-black/10 px-3 py-1.5 text-xs font-medium text-white/60">
                {insight.metric}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-white/28">
            {insight.detail}
          </p>

          {insight.actionHref && insight.actionLabel && (
            <Link
              href={insight.actionHref}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              {insight.actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

const severityPresentation: Record<
  InsightSeverity,
  {
    icon: typeof AlertTriangle;

    containerClassName: string;
    iconClassName: string;
  }
> = {
  critical: {
    icon: AlertTriangle,

    containerClassName: "border-red-400/20 bg-red-400/[0.06]",

    iconClassName: "bg-red-400/10 text-red-300",
  },

  warning: {
    icon: CircleAlert,

    containerClassName: "border-amber-400/20 bg-amber-400/[0.045]",

    iconClassName: "bg-amber-400/10 text-amber-300",
  },

  positive: {
    icon: CheckCircle2,

    containerClassName: "border-emerald-400/15 bg-emerald-400/[0.04]",

    iconClassName: "bg-emerald-400/10 text-emerald-300",
  },

  info: {
    icon: Info,

    containerClassName: "border-cyan-400/15 bg-cyan-400/[0.035]",

    iconClassName: "bg-cyan-400/10 text-cyan-300",
  },
};
