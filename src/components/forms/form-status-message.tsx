import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface FormStatusMessageProps {
  status: "idle" | "success" | "error";

  message?: string;
  id?: string;
  className?: string;
}

export function FormStatusMessage({
  status,
  message,
  id,
  className,
}: FormStatusMessageProps) {
  if (!message) {
    return null;
  }

  const isError = status === "error";

  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      id={id}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        [
          "flex items-start gap-3",
          "rounded-xl border",
          "px-4 py-3",
          "text-sm leading-6",
        ].join(" "),

        isError
          ? "border-red-400/20 bg-red-400/10 text-red-200"
          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",

        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

      <span>{message}</span>
    </div>
  );
}
