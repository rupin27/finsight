"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoanProfileFieldErrors } from "@/features/loans/loan-profile-validation";
import {
  LOAN_RATE_TYPES,
  type StudentLoanRecord,
} from "@/features/loans/loan.types";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface LoanProfileFormFieldsProps {
  loan: StudentLoanRecord;

  fieldErrors?: LoanProfileFieldErrors;

  idPrefix: string;
}

export function LoanProfileFormFields({
  loan,
  fieldErrors,
  idPrefix,
}: LoanProfileFormFieldsProps) {
  const profile = loan.profile;

  const ids = {
    lender: `${idPrefix}-lender`,

    originalPrincipal: `${idPrefix}-original-principal`,

    originalTermMonths: `${idPrefix}-original-term-months`,

    annualInterestRate: `${idPrefix}-annual-interest-rate`,

    rateType: `${idPrefix}-rate-type`,

    requiredMonthlyPayment: `${idPrefix}-required-monthly-payment`,

    nextPaymentDate: `${idPrefix}-next-payment-date`,
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div
        aria-label={`Current outstanding balance: ${formatCurrency(
          loan.currentBalance,
          loan.currency,
        )}`}
        className="rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-4 sm:col-span-2"
      >
        <p className="text-xs font-medium text-white/35">
          Current outstanding balance
        </p>

        <p className="financial-number mt-2 text-xl font-semibold text-violet-200">
          {formatCurrency(loan.currentBalance, loan.currency)}
        </p>

        <p className="mt-2 text-xs leading-5 text-white/30">
          This balance comes from the loan account and recorded loan-payment
          transactions. It cannot be edited here.
        </p>
      </div>

      <FormField
        id={ids.lender}
        label="Lender"
        description="Optional. The financial institution currently servicing the loan."
        error={fieldErrors?.lender?.[0]}
        className="sm:col-span-2"
      >
        <Input
          id={ids.lender}
          name="lender"
          type="text"
          defaultValue={profile?.lender ?? loan.institution ?? ""}
          placeholder="Example: Axis Bank"
          autoComplete="organization"
          aria-invalid={Boolean(fieldErrors?.lender?.[0])}
          aria-describedby={getDescriptionIds(
            ids.lender,
            fieldErrors?.lender?.[0],
            true,
          )}
        />
      </FormField>

      <FormField
        id={ids.originalPrincipal}
        label={`Original principal (${loan.currency})`}
        description="The amount originally borrowed. This is used for reference and historical context."
        error={fieldErrors?.originalPrincipal?.[0]}
      >
        <Input
          id={ids.originalPrincipal}
          name="originalPrincipal"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          defaultValue={profile?.originalPrincipal ?? loan.openingBalance}
          placeholder="0.00"
          aria-invalid={Boolean(fieldErrors?.originalPrincipal?.[0])}
          aria-describedby={getDescriptionIds(
            ids.originalPrincipal,
            fieldErrors?.originalPrincipal?.[0],
            true,
          )}
        />
      </FormField>

      <FormField
        id={ids.originalTermMonths}
        label="Original term in months"
        description="Optional. The loan’s original scheduled repayment duration."
        error={fieldErrors?.originalTermMonths?.[0]}
      >
        <Input
          id={ids.originalTermMonths}
          name="originalTermMonths"
          type="number"
          inputMode="numeric"
          min="1"
          max="600"
          step="1"
          defaultValue={profile?.originalTermMonths ?? ""}
          placeholder="Example: 158"
          aria-invalid={Boolean(fieldErrors?.originalTermMonths?.[0])}
          aria-describedby={getDescriptionIds(
            ids.originalTermMonths,
            fieldErrors?.originalTermMonths?.[0],
            true,
          )}
        />
      </FormField>

      <FormField
        id={ids.annualInterestRate}
        label="Current annual interest rate (%)"
        description="Enter the current nominal annual rate shown by your lender."
        error={fieldErrors?.annualInterestRate?.[0]}
      >
        <Input
          id={ids.annualInterestRate}
          name="annualInterestRate"
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="0.001"
          defaultValue={profile?.annualInterestRate ?? ""}
          placeholder="Example: 8.35"
          required
          aria-invalid={Boolean(fieldErrors?.annualInterestRate?.[0])}
          aria-describedby={getDescriptionIds(
            ids.annualInterestRate,
            fieldErrors?.annualInterestRate?.[0],
            true,
          )}
        />
      </FormField>

      <FormField
        id={ids.rateType}
        label="Rate type"
        description="Variable rates should be updated whenever the lender revises the rate."
        error={fieldErrors?.rateType?.[0]}
      >
        <select
          id={ids.rateType}
          name="rateType"
          defaultValue={profile?.rateType ?? "variable"}
          aria-invalid={Boolean(fieldErrors?.rateType?.[0])}
          aria-describedby={getDescriptionIds(
            ids.rateType,
            fieldErrors?.rateType?.[0],
            true,
          )}
          className={cn(
            selectClassName,

            fieldErrors?.rateType?.length && "border-red-400/40",
          )}
        >
          {LOAN_RATE_TYPES.map((rateType) => (
            <option key={rateType} value={rateType} className="bg-[#0b0f17]">
              {rateType === "fixed" ? "Fixed" : "Variable"}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id={ids.requiredMonthlyPayment}
        label={`Required monthly payment (${loan.currency})`}
        description="The minimum scheduled amount required by the lender."
        error={fieldErrors?.requiredMonthlyPayment?.[0]}
      >
        <Input
          id={ids.requiredMonthlyPayment}
          name="requiredMonthlyPayment"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          defaultValue={profile?.requiredMonthlyPayment ?? ""}
          placeholder="Example: 95069"
          required
          aria-invalid={Boolean(fieldErrors?.requiredMonthlyPayment?.[0])}
          aria-describedby={getDescriptionIds(
            ids.requiredMonthlyPayment,
            fieldErrors?.requiredMonthlyPayment?.[0],
            true,
          )}
        />
      </FormField>

      <FormField
        id={ids.nextPaymentDate}
        label="Next payment date"
        description="The optimizer begins its future schedule from this date."
        error={fieldErrors?.nextPaymentDate?.[0]}
      >
        <Input
          id={ids.nextPaymentDate}
          name="nextPaymentDate"
          type="date"
          defaultValue={profile?.nextPaymentDate ?? getDefaultNextPaymentDate()}
          required
          aria-invalid={Boolean(fieldErrors?.nextPaymentDate?.[0])}
          aria-describedby={getDescriptionIds(
            ids.nextPaymentDate,
            fieldErrors?.nextPaymentDate?.[0],
            true,
          )}
          className="[color-scheme:dark]"
        />
      </FormField>

      <aside className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/60 sm:col-span-2">
        The optimizer assumes the entered interest rate remains unchanged.
        Update this profile whenever a variable-rate lender revises the rate.
      </aside>
    </div>
  );
}

function FormField({
  id,
  label,
  description,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>

      {description && (
        <p id={`${id}-description`} className="text-xs leading-5 text-white/32">
          {description}
        </p>
      )}

      {children}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs leading-5 text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function getDescriptionIds(
  id: string,
  error?: string,
  hasDescription = false,
): string | undefined {
  const ids = [
    hasDescription ? `${id}-description` : null,

    error ? `${id}-error` : null,
  ].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
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
  "disabled:cursor-not-allowed",
  "disabled:opacity-50",
  "aria-invalid:border-destructive",
  "aria-invalid:ring-2",
  "aria-invalid:ring-destructive/20",
].join(" ");

function getDefaultNextPaymentDate(): string {
  const now = new Date();

  const nextMonth = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      Math.min(now.getUTCDate(), 28),
    ),
  );

  return nextMonth.toISOString().slice(0, 10);
}
