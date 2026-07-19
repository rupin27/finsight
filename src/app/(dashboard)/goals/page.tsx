import { Goal, ShieldCheck } from "lucide-react";

import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { getGoalsDashboardData } from "@/features/goals/goal-data";
import { GoalsDashboard } from "@/features/goals/components/goals-dashboard";

export default async function GoalsPage() {
  const data = await getGoalsDashboardData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
            <ShieldCheck className="size-3.5" />
            Balance-linked planning
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Financial goals
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Connect savings targets, emergency reserves, and debt payoff plans
            to your real account balances and cash-flow forecast.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Goal className="size-4 text-violet-300" />
            Live progress
          </div>

          <DisplayCurrencySelector value={data.displayCurrency} />
        </div>
      </header>

      <GoalsDashboard data={data} />
    </div>
  );
}
