import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "group/badge",
    "inline-flex min-h-6 w-fit shrink-0",
    "items-center justify-center gap-1.5",
    "overflow-hidden rounded-full",
    "border border-transparent",
    "px-2.5 py-0.5",
    "text-xs font-semibold",
    "leading-5 whitespace-nowrap",
    "outline-none",
    "transition-[border-color,background-color,color,box-shadow]",
    "duration-150",
    "focus-visible:border-cyan-300/45",
    "focus-visible:ring-2",
    "focus-visible:ring-cyan-300/20",
    "has-data-[icon=inline-end]:pr-2",
    "has-data-[icon=inline-start]:pl-2",
    "aria-invalid:border-destructive",
    "aria-invalid:ring-2",
    "aria-invalid:ring-destructive/20",
    "[&>svg]:pointer-events-none",
    "[&>svg]:size-3.5",
    "[&>svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-cyan-400/15",
          "bg-cyan-400/10",
          "text-cyan-200",
          "[a]:hover:bg-cyan-400/15",
          "[a]:hover:text-cyan-100",
        ].join(" "),

        secondary: [
          "border-white/[0.07]",
          "bg-white/[0.055]",
          "text-white/60",
          "[a]:hover:bg-white/[0.09]",
          "[a]:hover:text-white/80",
        ].join(" "),

        destructive: [
          "border-red-400/20",
          "bg-red-400/10",
          "text-red-200",
          "focus-visible:ring-red-300/20",
          "[a]:hover:bg-red-400/16",
          "[a]:hover:text-red-100",
        ].join(" "),

        outline: [
          "border-white/[0.09]",
          "bg-transparent",
          "text-white/58",
          "[a]:hover:border-white/[0.14]",
          "[a]:hover:bg-white/[0.05]",
          "[a]:hover:text-white/78",
        ].join(" "),

        ghost: [
          "text-white/52",
          "hover:bg-white/[0.06]",
          "hover:text-white/75",
        ].join(" "),

        link: [
          "min-h-0",
          "rounded-none",
          "px-0 py-0",
          "text-cyan-300",
          "underline-offset-4",
          "hover:text-cyan-200",
          "hover:underline",
        ].join(" "),
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",

    props: mergeProps<"span">(
      {
        className: cn(
          badgeVariants({
            variant,
          }),
          className,
        ),
      },

      props,
    ),

    render,

    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
