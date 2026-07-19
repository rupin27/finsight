"use client";

import { RotateCcw, Zap } from "lucide-react";

import type { AccountCurrency } from "@/features/accounts/account.types";
import type { LoanOptimizerAssumptions } from "@/features/loans/loan.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/finance/currency";

interface LoanOptimizerControlsProps {
  currency: AccountCurrency;

  requiredMonthlyPayment: number;

  assumptions: LoanOptimizerAssumptions;

  onChange: (assumptions: LoanOptimizerAssumptions) => void;

  onReset: () => void;
}

export function LoanOptimizerControls({
  currency,
  requiredMonthlyPayment,
  assumptions,
  onChange,
  onReset,
}: LoanOptimizerControlsProps) {
  function updateValue(
    field: keyof LoanOptimizerAssumptions,
    rawValue: string,
  ) {
    const parsed = Number(rawValue);

    onChange({
      ...assumptions,

      [field]: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
    });
  }

  const acceleratedMonthlyPayment =
    requiredMonthlyPayment + assumptions.additionalMonthlyPayment;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-300" />

            <h2 className="font-medium text-white">
              Accelerated-payoff scenario
            </h2>
          </div>

          <p className="mt-2 text-sm text-white/35">
            Test extra payments without changing your real account or recorded
            transactions.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-white/10 bg-transparent text-white/45 hover:bg-white/[0.06] hover:text-white"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="additionalMonthlyPayment" className="text-white/60">
            Additional monthly payment ({currency})
          </Label>

          <Input
            id="additionalMonthlyPayment"
            type="number"
            min="0"
            step="100"
            value={assumptions.additionalMonthlyPayment}
            onChange={(event) => {
              updateValue("additionalMonthlyPayment", event.target.value);
            }}
            className="border-white/10 bg-white/[0.04] text-white"
          />

          <p className="text-xs text-white/25">
            Added to every future required payment.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="oneTimePayment" className="text-white/60">
            One-time prepayment ({currency})
          </Label>

          <Input
            id="oneTimePayment"
            type="number"
            min="0"
            step="1000"
            value={assumptions.oneTimePayment}
            onChange={(event) => {
              updateValue("oneTimePayment", event.target.value);
            }}
            className="border-white/10 bg-white/[0.04] text-white"
          />

          <p className="text-xs text-white/25">
            Applied with the next scheduled payment.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3">
        <p className="text-xs text-white/30">Scenario monthly payment</p>

        <p className="mt-1 font-medium text-cyan-200">
          {formatCurrency(acceleratedMonthlyPayment, currency)}
        </p>
      </div>
    </section>
  );
}
