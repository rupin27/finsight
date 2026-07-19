import { Bot, BrainCircuit, ShieldCheck } from "lucide-react";

import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { InsightsDashboard } from "@/features/insights/components/insights-dashboard";
import { getInsightsDashboardData } from "@/features/insights/insight-data";

export default async function InsightsPage() {
  const data = await getInsightsDashboardData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.05] px-3 py-1.5 text-xs font-medium text-violet-200">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Explainable financial intelligence
          </div>

          <h1 className="page-title">AI financial coach</h1>

          <p className="page-description">
            Understand your financial health, detect unusual spending, and ask
            questions using your balances, projections, goals, and loan
            scenarios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={
              data.aiEnabled
                ? "flex min-h-10 items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] px-3 text-xs font-medium text-emerald-200/80"
                : "flex min-h-10 items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.045] px-3 text-xs font-medium text-amber-200/80"
            }
          >
            {data.aiEnabled ? (
              <>
                <Bot aria-hidden="true" className="size-4 text-emerald-300" />
                AI coach available
              </>
            ) : (
              <>
                <BrainCircuit
                  aria-hidden="true"
                  className="size-4 text-amber-300"
                />
                Deterministic insights only
              </>
            )}
          </div>

          <DisplayCurrencySelector value={data.displayCurrency} />
        </div>
      </header>

      <InsightsDashboard data={data} />
    </div>
  );
}
