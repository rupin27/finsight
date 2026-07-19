import { ChartNoAxesCombined, ShieldCheck } from "lucide-react";

import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { ProjectionDashboard } from "@/features/projections/components/projection-dashboard";
import { getProjectionPageData } from "@/features/projections/projection-data";

export default async function ProjectionsPage() {
  const data = await getProjectionPageData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Deterministic forecast
          </div>

          <h1 className="page-title">Savings projections</h1>

          <p className="page-description">
            Forecast your future cash balance using recurring income, expenses,
            loan payments, and adjustable what-if assumptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-medium text-white/38">
            <ChartNoAxesCombined
              aria-hidden="true"
              className="size-4 text-violet-300"
            />
            Up to 24 months
          </div>

          <DisplayCurrencySelector value={data.displayCurrency} />
        </div>
      </header>

      <ProjectionDashboard data={data} />
    </div>
  );
}
