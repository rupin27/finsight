"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        [
          "fixed inset-0 isolate z-50",
          "bg-black/75",
          "backdrop-blur-sm",
          "duration-150",
          "data-open:animate-in",
          "data-open:fade-in-0",
          "data-closed:animate-out",
          "data-closed:fade-out-0",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm";
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />

      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          [
            "group/alert-dialog-content",
            "fixed top-1/2 left-1/2 z-50",
            "flex max-h-[calc(100dvh-2rem)]",
            "w-full max-w-[calc(100%-2rem)]",
            "-translate-x-1/2 -translate-y-1/2",
            "flex-col overflow-hidden",
            "rounded-2xl",
            "border border-white/[0.09]",
            "bg-[#0b0f17]",
            "text-white",
            "shadow-[0_30px_100px_rgba(0,0,0,0.6)]",
            "outline-none",
            "duration-150",
            "data-[size=default]:sm:max-w-lg",
            "data-[size=sm]:sm:max-w-md",
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
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        [
          "grid gap-2",
          "overflow-y-auto",
          "px-6 py-6",
          "text-left",
          "has-data-[slot=alert-dialog-media]:grid-cols-[auto_minmax(0,1fr)]",
          "has-data-[slot=alert-dialog-media]:gap-x-4",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        [
          "flex shrink-0",
          "flex-col-reverse gap-2",
          "border-t border-white/[0.07]",
          "bg-white/[0.018]",
          "px-6 py-4",
          "sm:flex-row sm:justify-end",
          "[&_[data-slot=button]]:w-full",
          "sm:[&_[data-slot=button]]:w-auto",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        [
          "row-span-2",
          "inline-flex size-11",
          "items-center justify-center",
          "rounded-xl",
          "border border-red-400/15",
          "bg-red-400/10",
          "text-red-300",
          "*:[svg:not([class*='size-'])]:size-5",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        [
          "font-heading",
          "text-lg font-semibold",
          "leading-6",
          "tracking-[-0.02em]",
          "text-white",
          "group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        [
          "text-sm leading-6",
          "text-white/42",
          "group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
          "*:[a]:underline",
          "*:[a]:underline-offset-3",
          "*:[a]:hover:text-white",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
