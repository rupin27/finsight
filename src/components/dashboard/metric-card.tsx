import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;

  accent?: "cyan" | "violet" | "emerald" | "amber";
}

const accentStyles = {
  cyan: {
    icon: "border-cyan-400/10 bg-cyan-400/10 text-cyan-300",

    glow: "from-cyan-400/[0.09]",
  },

  violet: {
    icon: "border-violet-400/10 bg-violet-400/10 text-violet-300",

    glow: "from-violet-400/[0.09]",
  },

  emerald: {
    icon: "border-emerald-400/10 bg-emerald-400/10 text-emerald-300",

    glow: "from-emerald-400/[0.09]",
  },

  amber: {
    icon: "border-amber-400/10 bg-amber-400/10 text-amber-300",

    glow: "from-amber-400/[0.09]",
  },
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "cyan",
}: MetricCardProps) {
  const styles = accentStyles[accent];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.12)] transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:border-white/[0.12] hover:bg-white/[0.035] hover:shadow-[0_22px_65px_rgba(0,0,0,0.18)]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          styles.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-medium text-white/42">{title}</p>

          <p
            title={value}
            className="financial-number mt-3 truncate text-[1.625rem] font-semibold leading-none text-white"
          >
            {value}
          </p>

          <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/34">
            {description}
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
    </article>
  );
}
