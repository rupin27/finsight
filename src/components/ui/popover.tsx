"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 6,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-[70]"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            [
              "z-[70]",
              "flex w-80",
              "max-w-[calc(100vw-2rem)]",
              "origin-(--transform-origin)",
              "flex-col gap-3",
              "rounded-xl",
              "border border-white/[0.09]",
              "bg-[#111722]/98",
              "p-4",
              "text-sm",
              "text-white/65",
              "shadow-2xl shadow-black/35",
              "backdrop-blur-2xl",
              "outline-none",
              "duration-150",
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=inline-end]:slide-in-from-left-2",
              "data-[side=inline-start]:slide-in-from-right-2",
              "data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2",
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
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn(
        [
          "text-sm font-semibold",
          "leading-5",
          "tracking-[-0.01em]",
          "text-white/82",
        ].join(" "),

        className,
      )}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-xs leading-5 text-white/38", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};
