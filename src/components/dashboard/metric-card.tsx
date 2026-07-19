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
    icon: "bg-cyan-400/10 text-cyan-300",
    glow: "from-cyan-400/10",
  },
  violet: {
    icon: "bg-violet-400/10 text-violet-300",
    glow: "from-violet-400/10",
  },
  emerald: {
    icon: "bg-emerald-400/10 text-emerald-300",
    glow: "from-emerald-400/10",
  },
  amber: {
    icon: "bg-amber-400/10 text-amber-300",
    glow: "from-amber-400/10",
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
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-lg shadow-black/10 transition-colors hover:border-white/[0.11]">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-0 transition-opacity group-hover:opacity-100",
          styles.glow,
        )}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40">{title}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-white/30">{description}</p>
        </div>

        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>
    </article>
  );
}
