import { ChartNoAxesCombined, ShieldCheck } from "lucide-react";

import { getProjectionPageData } from "@/features/projections/projection-data";
import { ProjectionDashboard } from "@/features/projections/components/projection-dashboard";
import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";

export default async function ProjectionsPage() {
  const data = await getProjectionPageData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
            <ShieldCheck className="size-3.5" />
            Deterministic forecast
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Savings projections
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Forecast your future cash balance using recurring income, expenses,
            loan payments, and adjustable what-if assumptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <ChartNoAxesCombined className="size-4 text-violet-300" />
            Up to 24 months
          </div>

          <DisplayCurrencySelector value={data.displayCurrency} />
        </div>
      </header>

      <ProjectionDashboard data={data} />
    </div>
  );
}
