"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn(
        ["flex w-full", "flex-wrap items-center", "gap-x-3 gap-y-2"].join(" "),

        className,
      )}
      {...props}
    >
      {children}

      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      className={cn(
        [
          "relative flex h-2",
          "w-full items-center",
          "overflow-hidden",
          "rounded-full",
          "border border-white/[0.04]",
          "bg-white/[0.06]",
          "shadow-inner shadow-black/10",
        ].join(" "),

        className,
      )}
      {...props}
    />
  );
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        [
          "h-full",
          "origin-left",
          "rounded-full",
          "bg-gradient-to-r",
          "from-cyan-400",
          "to-cyan-300",
          "shadow-[0_0_14px_rgba(103,232,249,0.24)]",
          "transition-[transform,width]",
          "duration-500",
          "ease-out",
          "motion-reduce:transition-none",
        ].join(" "),

        className,
      )}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      className={cn(
        ["text-xs font-semibold", "leading-5", "text-white/55"].join(" "),

        className,
      )}
      {...props}
    />
  );
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn(
        [
          "financial-number",
          "ml-auto",
          "text-xs font-semibold",
          "text-white/42",
        ].join(" "),

        className,
      )}
      {...props}
    />
  );
}

export {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
};
