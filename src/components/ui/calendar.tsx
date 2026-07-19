"use client";

import * as React from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, {
            month: "short",
          }),

        ...formatters,
      }}
      className={cn(
        [
          "group/calendar",
          "w-fit rounded-xl",
          "bg-transparent p-3",
          "text-white",
          "[--cell-radius:0.7rem]",
          "[--cell-size:2.25rem]",
          "in-data-[slot=card-content]:bg-transparent",
          "in-data-[slot=popover-content]:bg-transparent",
        ].join(" "),

        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,

        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,

        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),

        months: cn(
          ["relative flex", "flex-col gap-6", "md:flex-row"].join(" "),

          defaultClassNames.months,
        ),

        month: cn(
          "flex w-full flex-col gap-4",

          defaultClassNames.month,
        ),

        nav: cn(
          [
            "absolute inset-x-0 top-0",
            "flex w-full",
            "items-center justify-between",
            "gap-1",
          ].join(" "),

          defaultClassNames.nav,
        ),

        button_previous: cn(
          buttonVariants({
            variant: buttonVariant,
          }),

          [
            "size-(--cell-size)",
            "rounded-[var(--cell-radius)]",
            "p-0 select-none",
            "text-white/45",
            "hover:bg-white/[0.06]",
            "hover:text-white",
            "aria-disabled:pointer-events-none",
            "aria-disabled:opacity-35",
          ].join(" "),

          defaultClassNames.button_previous,
        ),

        button_next: cn(
          buttonVariants({
            variant: buttonVariant,
          }),

          [
            "size-(--cell-size)",
            "rounded-[var(--cell-radius)]",
            "p-0 select-none",
            "text-white/45",
            "hover:bg-white/[0.06]",
            "hover:text-white",
            "aria-disabled:pointer-events-none",
            "aria-disabled:opacity-35",
          ].join(" "),

          defaultClassNames.button_next,
        ),

        month_caption: cn(
          [
            "flex h-(--cell-size)",
            "w-full items-center",
            "justify-center",
            "px-(--cell-size)",
          ].join(" "),

          defaultClassNames.month_caption,
        ),

        dropdowns: cn(
          [
            "flex h-(--cell-size)",
            "w-full items-center",
            "justify-center gap-1.5",
            "text-sm font-semibold",
          ].join(" "),

          defaultClassNames.dropdowns,
        ),

        dropdown_root: cn(
          [
            "relative",
            "rounded-[var(--cell-radius)]",
            "outline-none",
            "focus-within:ring-2",
            "focus-within:ring-cyan-300/20",
          ].join(" "),

          defaultClassNames.dropdown_root,
        ),

        dropdown: cn(
          [
            "absolute inset-0",
            "cursor-pointer",
            "bg-[#111722]",
            "opacity-0",
          ].join(" "),

          defaultClassNames.dropdown,
        ),

        caption_label: cn(
          [
            "font-semibold",
            "tracking-[-0.01em]",
            "text-white/75",
            "select-none",
          ].join(" "),

          captionLayout === "label"
            ? "text-sm"
            : [
                "flex items-center",
                "gap-1 rounded-[var(--cell-radius)]",
                "text-sm",
                "[&>svg]:size-3.5",
                "[&>svg]:text-white/35",
              ].join(" "),

          defaultClassNames.caption_label,
        ),

        month_grid: cn(
          "w-full border-collapse",

          defaultClassNames.month_grid,
        ),

        weekdays: cn(
          "flex",

          defaultClassNames.weekdays,
        ),

        weekday: cn(
          [
            "flex-1",
            "rounded-[var(--cell-radius)]",
            "pb-1",
            "text-center",
            "text-[0.6875rem]",
            "font-semibold uppercase",
            "tracking-[0.08em]",
            "text-white/28",
            "select-none",
          ].join(" "),

          defaultClassNames.weekday,
        ),

        week: cn(
          "mt-1.5 flex w-full",

          defaultClassNames.week,
        ),

        week_number_header: cn(
          "w-(--cell-size) select-none",

          defaultClassNames.week_number_header,
        ),

        week_number: cn(
          ["text-[0.75rem]", "text-white/25", "select-none"].join(" "),

          defaultClassNames.week_number,
        ),

        day: cn(
          [
            "group/day relative",
            "aspect-square h-full w-full",
            "rounded-[var(--cell-radius)]",
            "p-0 text-center",
            "select-none",
            "[&:last-child[data-selected=true]_button]:rounded-r-[var(--cell-radius)]",
          ].join(" "),

          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-[var(--cell-radius)]"
            : "[&:first-child[data-selected=true]_button]:rounded-l-[var(--cell-radius)]",

          defaultClassNames.day,
        ),

        range_start: cn(
          [
            "relative isolate z-0",
            "rounded-l-[var(--cell-radius)]",
            "bg-cyan-400/[0.08]",
            "after:absolute",
            "after:inset-y-0",
            "after:right-0",
            "after:w-4",
            "after:bg-cyan-400/[0.08]",
          ].join(" "),

          defaultClassNames.range_start,
        ),

        range_middle: cn(
          "rounded-none bg-cyan-400/[0.08]",

          defaultClassNames.range_middle,
        ),

        range_end: cn(
          [
            "relative isolate z-0",
            "rounded-r-[var(--cell-radius)]",
            "bg-cyan-400/[0.08]",
            "after:absolute",
            "after:inset-y-0",
            "after:left-0",
            "after:w-4",
            "after:bg-cyan-400/[0.08]",
          ].join(" "),

          defaultClassNames.range_end,
        ),

        today: cn(
          [
            "rounded-[var(--cell-radius)]",
            "ring-1 ring-cyan-300/30",
            "data-[selected=true]:rounded-none",
          ].join(" "),

          defaultClassNames.today,
        ),

        outside: cn(
          ["text-white/20", "aria-selected:text-white/28"].join(" "),

          defaultClassNames.outside,
        ),

        disabled: cn(
          ["pointer-events-none", "text-white/18", "opacity-40"].join(" "),

          defaultClassNames.disabled,
        ),

        hidden: cn(
          "invisible",

          defaultClassNames.hidden,
        ),

        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...rootProps }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...rootProps}
          />
        ),

        Chevron: ({ className, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4", className)}
                {...chevronProps}
              />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...chevronProps}
              />
            );
          }

          return (
            <ChevronDownIcon
              className={cn("size-4", className)}
              {...chevronProps}
            />
          );
        },

        DayButton: (dayButtonProps) => (
          <CalendarDayButton locale={locale} {...dayButtonProps} />
        ),

        WeekNumber: ({ children, ...weekNumberProps }) => (
          <td {...weekNumberProps}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),

        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  locale?: Partial<Locale>;
}) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        [
          "relative isolate z-10",
          "flex aspect-square",
          "size-auto w-full",
          "min-w-(--cell-size)",
          "flex-col gap-1",
          "rounded-[var(--cell-radius)]",
          "border-0",
          "text-sm font-medium",
          "leading-none",
          "text-white/58",
          "outline-none",
          "transition-[background-color,color,box-shadow]",
          "hover:bg-white/[0.06]",
          "hover:text-white",
          "group-data-[focused=true]/day:z-10",
          "group-data-[focused=true]/day:ring-2",
          "group-data-[focused=true]/day:ring-cyan-300/25",
          "data-[range-end=true]:rounded-[var(--cell-radius)]",
          "data-[range-end=true]:rounded-r-[var(--cell-radius)]",
          "data-[range-end=true]:bg-cyan-300",
          "data-[range-end=true]:text-slate-950",
          "data-[range-middle=true]:rounded-none",
          "data-[range-middle=true]:bg-cyan-400/[0.08]",
          "data-[range-middle=true]:text-white/70",
          "data-[range-start=true]:rounded-[var(--cell-radius)]",
          "data-[range-start=true]:rounded-l-[var(--cell-radius)]",
          "data-[range-start=true]:bg-cyan-300",
          "data-[range-start=true]:text-slate-950",
          "data-[selected-single=true]:bg-cyan-300",
          "data-[selected-single=true]:text-slate-950",
          "disabled:pointer-events-none",
          "disabled:opacity-35",
          "[&>span]:text-xs",
          "[&>span]:opacity-70",
        ].join(" "),

        defaultClassNames.day,

        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
