"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto overscroll-x-contain"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        [
          "bg-white/[0.018]",
          "[&_tr]:border-b",
          "[&_tr]:border-white/[0.07]",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        [
          "border-t border-white/[0.07]",
          "bg-white/[0.025]",
          "font-medium",
          "[&>tr]:last:border-b-0",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        [
          "border-b border-white/[0.055]",
          "transition-colors duration-150",
          "hover:bg-white/[0.025]",
          "focus-within:bg-white/[0.025]",
          "has-aria-expanded:bg-white/[0.035]",
          "data-[state=selected]:bg-white/[0.045]",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        [
          "h-11 px-4",
          "text-left align-middle",
          "text-[0.6875rem]",
          "font-semibold uppercase",
          "tracking-[0.11em]",
          "whitespace-nowrap",
          "text-white/35",
          "[&:has([role=checkbox])]:pr-0",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        [
          "px-4 py-3.5",
          "align-middle",
          "whitespace-nowrap",
          "[&:has([role=checkbox])]:pr-0",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
