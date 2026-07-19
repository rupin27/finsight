"use client";

import type { StudentLoanRecord } from "@/features/loans/loan.types";
import { LOAN_RATE_TYPES } from "@/features/loans/loan.types";
import type { LoanProfileFieldErrors } from "@/features/loans/loan-profile-validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface LoanProfileFormFieldsProps {
  loan: StudentLoanRecord;

  fieldErrors?: LoanProfileFieldErrors;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10";

export function LoanProfileFormFields({
  loan,
  fieldErrors,
}: LoanProfileFormFieldsProps) {
  const profile = loan.profile;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.04] p-4 sm:col-span-2">
        <p className="text-xs text-white/35">Current outstanding balance</p>

        <p className="mt-2 text-xl font-semibold text-violet-200">
          {formatCurrency(loan.currentBalance, loan.currency)}
        </p>

        <p className="mt-2 text-xs leading-5 text-white/25">
          This balance comes from the loan account and recorded loan-payment
          transactions. It is not edited here.
        </p>
      </div>

      <FormField
        id="lender"
        label="Lender"
        errors={fieldErrors?.lender}
        className="sm:col-span-2"
      >
        <Input
          id="lender"
          name="lender"
          type="text"
          defaultValue={profile?.lender ?? loan.institution ?? ""}
          placeholder="Example: Axis Bank"
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />
      </FormField>

      <FormField
        id="originalPrincipal"
        label={`Original principal (${loan.currency})`}
        errors={fieldErrors?.originalPrincipal}
      >
        <Input
          id="originalPrincipal"
          name="originalPrincipal"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={profile?.originalPrincipal ?? loan.openingBalance}
          className="border-white/10 bg-white/[0.04] text-white"
        />
      </FormField>

      <FormField
        id="originalTermMonths"
        label="Original term in months"
        errors={fieldErrors?.originalTermMonths}
      >
        <Input
          id="originalTermMonths"
          name="originalTermMonths"
          type="number"
          min="1"
          max="600"
          step="1"
          defaultValue={profile?.originalTermMonths ?? ""}
          placeholder="Example: 158"
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />
      </FormField>

      <FormField
        id="annualInterestRate"
        label="Current annual interest rate (%)"
        errors={fieldErrors?.annualInterestRate}
      >
        <Input
          id="annualInterestRate"
          name="annualInterestRate"
          type="number"
          min="0"
          max="100"
          step="0.001"
          defaultValue={profile?.annualInterestRate ?? ""}
          placeholder="Example: 8.35"
          required
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />
      </FormField>

      <FormField id="rateType" label="Rate type" errors={fieldErrors?.rateType}>
        <select
          id="rateType"
          name="rateType"
          defaultValue={profile?.rateType ?? "variable"}
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
        id="requiredMonthlyPayment"
        label={`Required monthly payment (${loan.currency})`}
        errors={fieldErrors?.requiredMonthlyPayment}
      >
        <Input
          id="requiredMonthlyPayment"
          name="requiredMonthlyPayment"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={profile?.requiredMonthlyPayment ?? ""}
          placeholder="Example: 95069"
          required
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />
      </FormField>

      <FormField
        id="nextPaymentDate"
        label="Next payment date"
        errors={fieldErrors?.nextPaymentDate}
      >
        <Input
          id="nextPaymentDate"
          name="nextPaymentDate"
          type="date"
          defaultValue={profile?.nextPaymentDate ?? getDefaultNextPaymentDate()}
          required
          className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
        />
      </FormField>

      <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/55 sm:col-span-2">
        The optimizer assumes the entered interest rate remains unchanged.
        Update this profile whenever a variable-rate lender revises the rate.
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  errors,
  className,
  children,
}: {
  id: string;
  label: string;
  errors?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-white/65">
        {label}
      </Label>

      {children}

      {errors?.[0] && <p className="text-xs text-red-300">{errors[0]}</p>}
    </div>
  );
}

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
