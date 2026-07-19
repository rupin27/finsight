import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        [
          "h-10 w-full min-w-0 rounded-xl",
          "border border-input bg-transparent",
          "px-3.5 py-2",
          "text-[0.9375rem] text-foreground",
          "shadow-sm shadow-black/5",
          "outline-none",
          "transition-[border-color,background-color,box-shadow,opacity]",
          "duration-150",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-cyan-300/45",
          "focus-visible:ring-2 focus-visible:ring-cyan-300/20",
          "disabled:pointer-events-none",
          "disabled:cursor-not-allowed",
          "disabled:bg-input/40",
          "disabled:opacity-50",
          "aria-invalid:border-destructive",
          "aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          "file:mr-3 file:inline-flex file:h-7",
          "file:border-0 file:bg-transparent",
          "file:text-sm file:font-semibold",
          "file:text-foreground",
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

export { Input };
