import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        ["skeleton-shimmer", "rounded-xl", "bg-white/[0.045]"].join(" "),

        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
