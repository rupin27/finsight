"use client";

import { useId } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountCurrency } from "@/features/accounts/account.types";
import { DEFAULT_PROJECTION_ASSUMPTIONS } from "@/features/projections/projection-engine";
import type { ProjectionAssumptions } from "@/features/projections/projection.types";

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
  const idPrefix = useId();

  const ids = {
    title: `${idPrefix}-title`,

    months: `${idPrefix}-months`,

    additionalIncome: `${idPrefix}-additional-income`,

    additionalExpenses: `${idPrefix}-additional-expenses`,

    incomeGrowth: `${idPrefix}-income-growth`,

    expenseInflation: `${idPrefix}-expense-inflation`,
  };

  const hasCustomAssumptions = !areAssumptionsEqual(
    assumptions,
    DEFAULT_PROJECTION_ASSUMPTIONS,
  );

  function updateNumber(
    field: keyof ProjectionAssumptions,

    rawValue: string,
  ) {
    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed)) {
      return;
    }

    let nextValue = parsed;

    if (field === "months") {
      const validDurations = [6, 12, 18, 24];

      if (!validDurations.includes(parsed)) {
        return;
      }
    }

    if (
      field === "additionalMonthlyIncome" ||
      field === "additionalMonthlyExpenses"
    ) {
      nextValue = Math.max(0, parsed);
    }

    if (
      field === "annualIncomeGrowthPercent" ||
      field === "annualExpenseInflationPercent"
    ) {
      nextValue = Math.min(1000, Math.max(-100, parsed));
    }

    onChange({
      ...assumptions,
      [field]: nextValue,
    });
  }

  return (
    <section
      aria-labelledby={ids.title}
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id={ids.title} className="section-title">
            Projection assumptions
          </h2>

          <p className="section-description max-w-2xl">
            These values affect only the forecast. They do not create, update,
            or delete transactions.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasCustomAssumptions}
          onClick={onReset}
          className="border-white/10 bg-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          <RotateCcw className="size-3.5" />
          Reset assumptions
        </Button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor={ids.months}>Forecast duration</Label>

          <p
            id={`${ids.months}-description`}
            className="text-xs leading-5 text-white/32"
          >
            Choose how far into the future FinSight should project.
          </p>

          <select
            id={ids.months}
            value={assumptions.months}
            aria-describedby={`${ids.months}-description`}
            onChange={(event) => {
              updateNumber("months", event.target.value);
            }}
            className={selectClassName}
          >
            {[6, 12, 18, 24].map((months) => (
              <option key={months} value={months} className="bg-[#0b0f17]">
                {months} months
              </option>
            ))}
          </select>
        </div>

        <NumberField
          id={ids.additionalIncome}
          label={`Extra monthly income (${currency})`}
          description="Income expected each month in addition to existing recurring transactions."
          value={assumptions.additionalMonthlyIncome}
          min={0}
          step={100}
          onChange={(value) => {
            updateNumber("additionalMonthlyIncome", value);
          }}
        />

        <NumberField
          id={ids.additionalExpenses}
          label={`Extra monthly expenses (${currency})`}
          description="Spending expected each month in addition to existing recurring transactions."
          value={assumptions.additionalMonthlyExpenses}
          min={0}
          step={100}
          onChange={(value) => {
            updateNumber("additionalMonthlyExpenses", value);
          }}
        />

        <NumberField
          id={ids.incomeGrowth}
          label="Annual income growth (%)"
          description="Compounds projected recurring income over the forecast."
          value={assumptions.annualIncomeGrowthPercent}
          min={-100}
          max={1000}
          step={0.1}
          onChange={(value) => {
            updateNumber("annualIncomeGrowthPercent", value);
          }}
        />

        <NumberField
          id={ids.expenseInflation}
          label="Annual expense inflation (%)"
          description="Compounds projected recurring expenses over the forecast."
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
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;

  onChange: (value: string) => void;
}) {
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <p id={descriptionId} className="text-xs leading-5 text-white/32">
        {description}
      </p>

      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-describedby={descriptionId}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </div>
  );
}

function areAssumptionsEqual(
  first: ProjectionAssumptions,
  second: ProjectionAssumptions,
): boolean {
  return (
    first.months === second.months &&
    first.additionalMonthlyIncome === second.additionalMonthlyIncome &&
    first.additionalMonthlyExpenses === second.additionalMonthlyExpenses &&
    first.annualIncomeGrowthPercent === second.annualIncomeGrowthPercent &&
    first.annualExpenseInflationPercent === second.annualExpenseInflationPercent
  );
}

const selectClassName = [
  "flex h-10 w-full min-w-0",
  "rounded-xl border border-input",
  "bg-input/20 px-3.5 py-2",
  "text-[0.9375rem] text-white",
  "shadow-sm shadow-black/5",
  "outline-none",
  "transition-[border-color,background-color,box-shadow,opacity]",
  "duration-150",
  "focus-visible:border-cyan-300/45",
  "focus-visible:ring-2",
  "focus-visible:ring-cyan-300/20",
].join(" ");
