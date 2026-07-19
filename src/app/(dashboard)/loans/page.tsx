import { Calculator, ShieldCheck } from "lucide-react";

import { getLoanDashboardData } from "@/features/loans/loan-data";
import { LoanOptimizerDashboard } from "@/features/loans/components/loan-optimizer-dashboard";
import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";

export default async function LoansPage() {
  const data = await getLoanDashboardData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.05] px-3 py-1.5 text-xs font-medium text-violet-200">
            <ShieldCheck className="size-3.5" />
            Private payoff analysis
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Student-loan optimizer
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Compare your required repayment schedule with additional monthly
            payments and one-time prepayments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Calculator className="size-4 text-cyan-300" />
            Up to 600 payments
          </div>

          <DisplayCurrencySelector value={data.displayCurrency} />
        </div>
      </header>

      <LoanOptimizerDashboard data={data} />
    </div>
  );
}
