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

  const titleId = `insight-${insight.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        [
          "rounded-2xl border p-5",
          "shadow-[0_16px_48px_rgba(0,0,0,0.1)]",
          "transition-[border-color,background-color,transform,box-shadow]",
          "duration-200",
          "hover:-translate-y-px",
          "hover:shadow-[0_20px_56px_rgba(0,0,0,0.15)]",
        ].join(" "),

        presentation.containerClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",

            presentation.iconClassName,
          )}
        >
          <Icon className="size-[18px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold",

                    presentation.badgeClassName,
                  )}
                >
                  {presentation.label}
                </span>

                <h3
                  id={titleId}
                  className="text-base font-semibold tracking-[-0.015em] text-white"
                >
                  {insight.title}
                </h3>
              </div>

              <p className="mt-2 text-sm leading-6 text-white/48">
                {insight.summary}
              </p>
            </div>

            {insight.metric && (
              <span className="financial-number shrink-0 rounded-lg border border-white/[0.07] bg-black/10 px-3 py-1.5 text-xs font-semibold text-white/62">
                {insight.metric}
              </span>
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-white/32">
            {insight.detail}
          </p>

          {insight.actionHref && insight.actionLabel && (
            <Link
              href={insight.actionHref}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-cyan-300 outline-none transition-colors hover:text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-300/25"
            >
              {insight.actionLabel}

              <ArrowRight aria-hidden="true" className="size-4" />
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
    label: string;

    icon: typeof AlertTriangle;

    containerClassName: string;

    iconClassName: string;

    badgeClassName: string;
  }
> = {
  critical: {
    label: "Critical",

    icon: AlertTriangle,

    containerClassName: "border-red-400/20 bg-red-400/[0.06]",

    iconClassName: "border-red-400/10 bg-red-400/10 text-red-300",

    badgeClassName: "border-red-400/20 bg-red-400/[0.08] text-red-200",
  },

  warning: {
    label: "Warning",

    icon: CircleAlert,

    containerClassName: "border-amber-400/20 bg-amber-400/[0.045]",

    iconClassName: "border-amber-400/10 bg-amber-400/10 text-amber-300",

    badgeClassName: "border-amber-400/20 bg-amber-400/[0.08] text-amber-200",
  },

  positive: {
    label: "Positive",

    icon: CheckCircle2,

    containerClassName: "border-emerald-400/15 bg-emerald-400/[0.04]",

    iconClassName: "border-emerald-400/10 bg-emerald-400/10 text-emerald-300",

    badgeClassName:
      "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
  },

  info: {
    label: "Information",

    icon: Info,

    containerClassName: "border-cyan-400/15 bg-cyan-400/[0.035]",

    iconClassName: "border-cyan-400/10 bg-cyan-400/10 text-cyan-300",

    badgeClassName: "border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200",
  },
};
