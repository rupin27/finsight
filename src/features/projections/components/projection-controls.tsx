"use client";

import { RotateCcw } from "lucide-react";

import type { AccountCurrency } from "@/features/accounts/account.types";
import type { ProjectionAssumptions } from "@/features/projections/projection.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectionControlsProps {
  currency: AccountCurrency;
  assumptions: ProjectionAssumptions;

  onChange: (assumptions: ProjectionAssumptions) => void;

  onReset: () => void;
}

export function ProjectionControls({
  currency,
  assumptions,
  onChange,
  onReset,
}: ProjectionControlsProps) {
  function updateNumber(field: keyof ProjectionAssumptions, value: string) {
    const parsed = Number(value);

    onChange({
      ...assumptions,
      [field]: Number.isFinite(parsed) ? parsed : 0,
    });
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-medium text-white">Projection assumptions</h2>

          <p className="mt-1 text-sm text-white/35">
            These values affect only the forecast. They do not create or modify
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

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="projectionMonths" className="text-white/60">
            Forecast duration
          </Label>

          <select
            id="projectionMonths"
            value={assumptions.months}
            onChange={(event) => {
              updateNumber("months", event.target.value);
            }}
            className="flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
          >
            {[6, 12, 18, 24].map((months) => (
              <option key={months} value={months} className="bg-[#0b0f17]">
                {months} months
              </option>
            ))}
          </select>
        </div>

        <NumberField
          id="additionalIncome"
          label={`Extra monthly income (${currency})`}
          value={assumptions.additionalMonthlyIncome}
          min={0}
          step={100}
          onChange={(value) => {
            updateNumber("additionalMonthlyIncome", value);
          }}
        />

        <NumberField
          id="additionalExpenses"
          label={`Extra monthly expenses (${currency})`}
          value={assumptions.additionalMonthlyExpenses}
          min={0}
          step={100}
          onChange={(value) => {
            updateNumber("additionalMonthlyExpenses", value);
          }}
        />

        <NumberField
          id="incomeGrowth"
          label="Annual income growth (%)"
          value={assumptions.annualIncomeGrowthPercent}
          min={-100}
          max={1000}
          step={0.1}
          onChange={(value) => {
            updateNumber("annualIncomeGrowthPercent", value);
          }}
        />

        <NumberField
          id="expenseInflation"
          label="Annual expense inflation (%)"
          value={assumptions.annualExpenseInflationPercent}
          min={-100}
          max={1000}
          step={0.1}
          onChange={(value) => {
            updateNumber("annualExpenseInflationPercent", value);
          }}
        />
      </div>
    </section>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/60">
        {label}
      </Label>

      <Input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="border-white/10 bg-white/[0.04] text-white"
      />
    </div>
  );
}
