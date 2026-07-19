import { Bot, BrainCircuit, ShieldCheck } from "lucide-react";

import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { getInsightsDashboardData } from "@/features/insights/insight-data";
import { InsightsDashboard } from "@/features/insights/components/insights-dashboard";

export default async function InsightsPage() {
  const data = await getInsightsDashboardData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.05] px-3 py-1.5 text-xs font-medium text-violet-200">
            <ShieldCheck className="size-3.5" />
            Explainable financial intelligence
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            AI financial coach
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Understand your financial health, detect unusual spending, and ask
            questions using your balances, projections, goals, and loan
            scenarios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/30">
            {data.aiEnabled ? (
              <>
                <Bot className="size-4 text-emerald-300" />
                OpenAI connected
              </>
            ) : (
              <>
                <BrainCircuit className="size-4 text-amber-300" />
                Deterministic mode
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
