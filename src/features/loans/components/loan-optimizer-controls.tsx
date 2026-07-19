"use client";

import { useId } from "react";
import { RotateCcw, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountCurrency } from "@/features/accounts/account.types";
import type { LoanOptimizerAssumptions } from "@/features/loans/loan.types";
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
  const idPrefix = useId();

  const additionalPaymentId = `${idPrefix}-additional-payment`;

  const oneTimePaymentId = `${idPrefix}-one-time-payment`;

  const scenarioSummaryId = `${idPrefix}-scenario-summary`;

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

  const hasAdjustments =
    assumptions.additionalMonthlyPayment > 0 || assumptions.oneTimePayment > 0;

  return (
    <section
      aria-labelledby={`${idPrefix}-title`}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap aria-hidden="true" className="size-4 text-amber-300" />

            <h2 id={`${idPrefix}-title`} className="section-title">
              Accelerated-payoff scenario
            </h2>
          </div>

          <p className="section-description max-w-2xl">
            Test additional payments without changing your real account,
            repayment profile, or recorded transactions.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasAdjustments}
          onClick={onReset}
          className="border-white/10 bg-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          <RotateCcw className="size-3.5" />
          Reset scenario
        </Button>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={additionalPaymentId}>
            Additional monthly payment ({currency})
          </Label>

          <p
            id={`${additionalPaymentId}-description`}
            className="text-xs leading-5 text-white/32"
          >
            Added to every future required monthly payment.
          </p>

          <Input
            id={additionalPaymentId}
            type="number"
            inputMode="decimal"
            min="0"
            step="100"
            value={assumptions.additionalMonthlyPayment}
            onChange={(event) => {
              updateValue("additionalMonthlyPayment", event.target.value);
            }}
            aria-describedby={`${additionalPaymentId}-description ${scenarioSummaryId}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={oneTimePaymentId}>
            One-time prepayment ({currency})
          </Label>

          <p
            id={`${oneTimePaymentId}-description`}
            className="text-xs leading-5 text-white/32"
          >
            Applied together with the next scheduled payment.
          </p>

          <Input
            id={oneTimePaymentId}
            type="number"
            inputMode="decimal"
            min="0"
            step="1000"
            value={assumptions.oneTimePayment}
            onChange={(event) => {
              updateValue("oneTimePayment", event.target.value);
            }}
            aria-describedby={`${oneTimePaymentId}-description ${scenarioSummaryId}`}
          />
        </div>
      </div>

      <div
        id={scenarioSummaryId}
        role="status"
        aria-live="polite"
        className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3"
      >
        <p className="text-xs font-medium text-white/32">
          Scenario monthly payment
        </p>

        <p className="financial-number mt-1 text-base font-semibold text-cyan-200">
          {formatCurrency(acceleratedMonthlyPayment, currency)}
        </p>

        {assumptions.oneTimePayment > 0 && (
          <p className="financial-number mt-1 text-xs text-white/35">
            Plus a one-time payment of{" "}
            {formatCurrency(assumptions.oneTimePayment, currency)} on the next
            payment date.
          </p>
        )}
      </div>
    </section>
  );
}
