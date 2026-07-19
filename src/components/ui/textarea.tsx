import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        [
          "flex field-sizing-content",
          "min-h-28 w-full",
          "resize-y rounded-xl",
          "border border-input",
          "bg-transparent",
          "px-3.5 py-3",
          "text-[0.9375rem] leading-6",
          "text-foreground",
          "shadow-sm shadow-black/5",
          "outline-none",
          "transition-[border-color,background-color,box-shadow,opacity]",
          "duration-150",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-cyan-300/45",
          "focus-visible:ring-2 focus-visible:ring-cyan-300/20",
          "disabled:cursor-not-allowed",
          "disabled:bg-input/40",
          "disabled:opacity-50",
          "aria-invalid:border-destructive",
          "aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          "dark:bg-input/20",
          "dark:hover:bg-input/25",
          "dark:focus-visible:bg-input/30",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
