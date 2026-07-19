import { Calculator, ShieldCheck } from "lucide-react";

import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { LoanOptimizerDashboard } from "@/features/loans/components/loan-optimizer-dashboard";
import { getLoanDashboardData } from "@/features/loans/loan-data";

export default async function LoansPage() {
  const data = await getLoanDashboardData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.05] px-3 py-1.5 text-xs font-medium text-violet-200">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Private payoff analysis
          </div>

          <h1 className="page-title">Student-loan optimizer</h1>

          <p className="page-description">
            Compare your required repayment schedule with additional monthly
            payments and one-time prepayments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-medium text-white/38">
            <Calculator aria-hidden="true" className="size-4 text-cyan-300" />
            Up to 600 payments
          </div>

          <DisplayCurrencySelector value={data.displayCurrency} />
        </div>
      </header>

      <LoanOptimizerDashboard data={data} />
    </div>
  );
}
