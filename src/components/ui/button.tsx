import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button",
    "inline-flex shrink-0 items-center justify-center",
    "whitespace-nowrap rounded-xl border border-transparent",
    "bg-clip-padding text-sm font-semibold",
    "outline-none select-none",
    "transition-[color,background-color,border-color,box-shadow,transform,opacity]",
    "duration-150 ease-out",
    "focus-visible:border-cyan-300/50",
    "focus-visible:ring-2 focus-visible:ring-cyan-300/25",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
    "aria-invalid:border-destructive",
    "aria-invalid:ring-2 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none",
    "[&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/85",

        outline:
          "border-border bg-background/60 text-foreground shadow-sm hover:border-white/15 hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/20 dark:hover:bg-input/45",

        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",

        ghost:
          "bg-transparent text-foreground/70 hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",

        destructive:
          "border-destructive/15 bg-destructive/10 text-destructive shadow-sm hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",

        link: "h-auto rounded-none p-0 text-primary underline-offset-4 shadow-none hover:underline",
      },

      size: {
        default: "h-10 gap-2 px-4",

        xs: "h-8 gap-1.5 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",

        sm: "h-9 gap-1.5 rounded-[0.65rem] px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",

        lg: "h-11 gap-2 px-5 text-[0.9375rem]",

        icon: "size-10",

        "icon-xs": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",

        "icon-sm": "size-9 rounded-[0.65rem]",

        "icon-lg": "size-11",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
