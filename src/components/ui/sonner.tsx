"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      closeButton
      richColors
      visibleToasts={4}
      toastOptions={{
        duration: 4_500,

        classNames: {
          toast:
            "border-white/10 bg-[#111722]/95 text-white shadow-2xl shadow-black/30 backdrop-blur-xl",

          title: "font-semibold tracking-[-0.01em]",

          description: "text-white/55",

          actionButton: "bg-cyan-300 text-slate-950",

          cancelButton: "bg-white/[0.07] text-white/65",
        },
      }}
      {...props}
    />
  );
}
