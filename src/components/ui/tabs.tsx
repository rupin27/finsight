"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        [
          "group/tabs",
          "flex min-w-0",
          "gap-3",
          "data-horizontal:flex-col",
          "data-vertical:flex-row",
        ].join(" "),

        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  [
    "group/tabs-list",
    "inline-flex max-w-full",
    "items-center",
    "text-white/42",
    "group-data-horizontal/tabs:min-h-10",
    "group-data-vertical/tabs:h-fit",
    "group-data-vertical/tabs:flex-col",
    "data-[variant=line]:rounded-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "w-fit gap-1",
          "overflow-x-auto",
          "overscroll-x-contain",
          "rounded-xl",
          "border border-white/[0.06]",
          "bg-white/[0.045]",
          "p-1",
        ].join(" "),

        line: [
          "w-full gap-1",
          "overflow-x-auto",
          "overscroll-x-contain",
          "border-b border-white/[0.07]",
          "bg-transparent",
          "p-0",
        ].join(" "),
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        tabsListVariants({
          variant,
        }),

        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        [
          "relative inline-flex",
          "min-h-9 shrink-0 flex-1",
          "items-center justify-center",
          "gap-2",
          "rounded-lg",
          "border border-transparent",
          "px-3 py-1.5",
          "text-sm font-semibold",
          "whitespace-nowrap",
          "text-white/42",
          "outline-none",
          "transition-[border-color,background-color,color,box-shadow]",
          "duration-150",
          "group-data-vertical/tabs:w-full",
          "group-data-vertical/tabs:justify-start",
          "hover:text-white/70",
          "focus-visible:border-cyan-300/40",
          "focus-visible:ring-2",
          "focus-visible:ring-cyan-300/20",
          "disabled:pointer-events-none",
          "disabled:opacity-40",
          "aria-disabled:pointer-events-none",
          "aria-disabled:opacity-40",
          "group-data-[variant=default]/tabs-list:data-active:border-white/[0.08]",
          "group-data-[variant=default]/tabs-list:data-active:bg-white/[0.075]",
          "group-data-[variant=default]/tabs-list:data-active:text-white",
          "group-data-[variant=default]/tabs-list:data-active:shadow-sm",
          "group-data-[variant=line]/tabs-list:rounded-none",
          "group-data-[variant=line]/tabs-list:bg-transparent",
          "group-data-[variant=line]/tabs-list:px-3",
          "group-data-[variant=line]/tabs-list:data-active:bg-transparent",
          "group-data-[variant=line]/tabs-list:data-active:text-white",
          "[&_svg]:pointer-events-none",
          "[&_svg]:shrink-0",
          "[&_svg:not([class*='size-'])]:size-4",
          "after:absolute",
          "after:bg-cyan-300",
          "after:opacity-0",
          "after:transition-opacity",
          "after:duration-150",
          "group-data-horizontal/tabs:after:inset-x-2",
          "group-data-horizontal/tabs:after:-bottom-[5px]",
          "group-data-horizontal/tabs:after:h-0.5",
          "group-data-horizontal/tabs:after:rounded-full",
          "group-data-vertical/tabs:after:inset-y-1",
          "group-data-vertical/tabs:after:-right-1",
          "group-data-vertical/tabs:after:w-0.5",
          "group-data-vertical/tabs:after:rounded-full",
          "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        ].join(" "),

        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        [
          "min-w-0 flex-1",
          "text-sm",
          "outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-cyan-300/15",
        ].join(" "),

        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
