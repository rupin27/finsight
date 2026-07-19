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
      <div className="flex size-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 shadow-[0_0_32px_rgba(34,211,238,0.12)]">
        <Landmark className="size-5 text-cyan-300" />
      </div>

      {!compact && (
        <div>
          <p className="text-base font-semibold tracking-tight text-white">
            FinSight
          </p>

          <p className="text-xs text-white/40">Personal finance intelligence</p>
        </div>
      )}
    </div>
  );
}
