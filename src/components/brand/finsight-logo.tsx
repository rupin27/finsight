import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

interface FinSightLogoProps {
  compact?: boolean;
  className?: string;
}

export function FinSightLogo({
  compact = false,
  className,
}: FinSightLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/16 to-cyan-300/[0.055] shadow-[0_12px_36px_rgba(34,211,238,0.09)]">
        <div
          aria-hidden="true"
          className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent"
        />

        <Landmark
          aria-hidden="true"
          className="relative size-[19px] text-cyan-200"
        />
      </div>

      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-[1.0625rem] font-semibold tracking-[-0.025em] text-white">
            FinSight
          </p>

          <p className="truncate text-[0.6875rem] font-medium tracking-[0.01em] text-white/38">
            Personal finance intelligence
          </p>
        </div>
      )}
    </div>
  );
}
