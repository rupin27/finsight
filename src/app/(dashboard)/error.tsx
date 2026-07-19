"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardErrorProps {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[dashboard-error]", error);
  }, [error]);

  return (
    <section
      role="alert"
      aria-labelledby="dashboard-error-title"
      className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center"
    >
      <div className="w-full rounded-2xl border border-red-400/20 bg-red-400/[0.045] p-6 text-center shadow-2xl shadow-black/20 sm:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/10 text-red-300">
          <AlertTriangle className="size-6" />
        </div>

        <h1
          id="dashboard-error-title"
          className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white"
        >
          This section could not be loaded
        </h1>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/45">
          FinSight encountered an unexpected problem while loading this page.
          Your financial data was not changed.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-xs text-white/25">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={reset}
            className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>

          <Link
            href="/overview"
            className={cn(
              buttonVariants({
                variant: "outline",
              }),

              "border-white/10 bg-transparent text-white/60 hover:bg-white/[0.06]",
            )}
          >
            <ArrowLeft className="size-4" />
            Return to overview
          </Link>
        </div>
      </div>
    </section>
  );
}
