"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1.5", className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex min-w-0 flex-1 items-center text-left", className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        [
          "flex w-full min-w-0",
          "items-center justify-between",
          "gap-2 rounded-xl",
          "border border-input",
          "bg-transparent",
          "px-3.5",
          "text-[0.9375rem]",
          "text-foreground",
          "shadow-sm shadow-black/5",
          "outline-none select-none",
          "transition-[border-color,background-color,box-shadow,opacity]",
          "duration-150",
          "data-[size=default]:h-10",
          "data-[size=sm]:h-9",
          "data-[size=sm]:rounded-[0.65rem]",
          "data-placeholder:text-muted-foreground/70",
          "focus-visible:border-cyan-300/45",
          "focus-visible:ring-2 focus-visible:ring-cyan-300/20",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          "aria-invalid:border-destructive",
          "aria-invalid:ring-2 aria-invalid:ring-destructive/20",
          "dark:bg-input/20",
          "dark:hover:bg-input/30",
          "*:data-[slot=select-value]:line-clamp-1",
          "[&_svg]:pointer-events-none",
          "[&_svg]:shrink-0",
          "[&_svg:not([class*='size-'])]:size-4",
        ].join(" "),
        className,
      )}
      {...props}
    >
      {children}

      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-[70]"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            [
              "relative isolate z-[70]",
              "max-h-(--available-height)",
              "w-(--anchor-width)",
              "min-w-40",
              "origin-(--transform-origin)",
              "overflow-x-hidden overflow-y-auto",
              "rounded-xl",
              "border border-white/[0.09]",
              "bg-[#111722]/98",
              "p-1",
              "text-popover-foreground",
              "shadow-2xl shadow-black/35",
              "backdrop-blur-2xl",
              "outline-none",
              "duration-100",
              "data-[align-trigger=true]:animate-none",
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=top]:slide-in-from-bottom-2",
              "data-open:animate-in",
              "data-open:fade-in-0",
              "data-open:zoom-in-95",
              "data-closed:animate-out",
              "data-closed:fade-out-0",
              "data-closed:zoom-out-95",
            ].join(" "),
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />

          <SelectPrimitive.List>{children}</SelectPrimitive.List>

          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        [
          "px-2.5 py-2",
          "text-[0.6875rem]",
          "font-semibold uppercase",
          "tracking-[0.13em]",
          "text-muted-foreground",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        [
          "relative flex min-h-10 w-full",
          "cursor-default items-center",
          "gap-2 rounded-lg",
          "py-2 pr-9 pl-2.5",
          "text-sm text-white/65",
          "outline-none select-none",
          "transition-colors",
          "focus:bg-white/[0.07]",
          "focus:text-white",
          "data-disabled:pointer-events-none",
          "data-disabled:opacity-40",
          "[&_svg]:pointer-events-none",
          "[&_svg]:shrink-0",
          "[&_svg:not([class*='size-'])]:size-4",
          "*:[span]:last:flex",
          "*:[span]:last:items-center",
          "*:[span]:last:gap-2",
        ].join(" "),
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-2">
        {children}
      </SelectPrimitive.ItemText>

      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2.5 flex size-4 items-center justify-center text-cyan-300" />
        }
      >
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-white/[0.07]",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        [
          "sticky top-0 z-10",
          "flex w-full items-center",
          "justify-center",
          "rounded-lg",
          "bg-[#111722]",
          "py-1.5",
          "text-white/45",
        ].join(" "),
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        [
          "sticky bottom-0 z-10",
          "flex w-full items-center",
          "justify-center",
          "rounded-lg",
          "bg-[#111722]",
          "py-1.5",
          "text-white/45",
        ].join(" "),
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
