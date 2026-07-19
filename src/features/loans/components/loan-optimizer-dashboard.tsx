"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarCheck2,
  CircleDollarSign,
  Landmark,
  PiggyBank,
  ReceiptText,
  TimerReset,
  TrendingDown,
  WalletCards,
} from "lucide-react";

import type {
  LoanDashboardData,
  LoanOptimizerAssumptions,
} from "@/features/loans/loan.types";
import {
  buildLoanScenarioComparison,
  DEFAULT_LOAN_OPTIMIZER_ASSUMPTIONS,
} from "@/features/loans/loan-amortization";
import { LoanProfileDialog } from "@/features/loans/components/loan-profile-dialog";
import { LoanOptimizerControls } from "@/features/loans/components/loan-optimizer-controls";
import { LoanPayoffChart } from "@/features/loans/components/loan-payoff-chart";
import { AmortizationTable } from "@/features/loans/components/amortization-table";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface LoanOptimizerDashboardProps {
  data: LoanDashboardData;
}

export function LoanOptimizerDashboard({ data }: LoanOptimizerDashboardProps) {
  const defaultLoan = data.loans.find((loan) => loan.profile) ?? data.loans[0];

  const [selectedLoanId, setSelectedLoanId] = useState(
    defaultLoan?.accountId ?? "",
  );

  const [assumptions, setAssumptions] = useState<LoanOptimizerAssumptions>(
    DEFAULT_LOAN_OPTIMIZER_ASSUMPTIONS,
  );

  useEffect(() => {
    if (
      data.loans.length > 0 &&
      !data.loans.some((loan) => loan.accountId === selectedLoanId)
    ) {
      setSelectedLoanId(data.loans[0].accountId);
    }
  }, [data.loans, selectedLoanId]);

  const selectedLoan =
    data.loans.find((loan) => loan.accountId === selectedLoanId) ??
    data.loans[0];

  useEffect(() => {
    setAssumptions(DEFAULT_LOAN_OPTIMIZER_ASSUMPTIONS);
  }, [selectedLoanId]);

  if (data.loans.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-400/[0.07]">
          <Landmark className="size-6 text-violet-300" />
        </div>

        <h2 className="mt-5 font-medium text-white">
          Add your student-loan account
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
          Create an account with the Loan account type before configuring the
          amortization optimizer.
        </p>

        <Link
          href="/accounts"
          className={cn(
            buttonVariants(),
            "mt-6 bg-cyan-300 text-slate-950 hover:bg-cyan-200",
          )}
        >
          Go to accounts
        </Link>
      </section>
    );
  }

  if (!selectedLoan) {
    return null;
  }

  const profile = selectedLoan.profile;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AggregateCard
          title="Total outstanding"
          value={formatCurrency(
            data.totalBalanceInDisplayCurrency,
            data.displayCurrency,
          )}
          description={`${data.loans.length} ${
            data.loans.length === 1 ? "loan account" : "loan accounts"
          }`}
          icon={Landmark}
          accent="violet"
        />

        <AggregateCard
          title="Payments recorded"
          value={formatCurrency(
            data.totalPaymentsInDisplayCurrency,
            data.displayCurrency,
          )}
          description="Loan-payment transactions"
          icon={ReceiptText}
          accent="cyan"
        />

        <AggregateCard
          title="Configured loans"
          value={String(data.loans.filter((loan) => loan.profile).length)}
          description="Ready for payoff analysis"
          icon={CircleDollarSign}
          accent="emerald"
        />

        <AggregateCard
          title="FX rate date"
          value={
            data.fxEffectiveDate
              ? formatShortDate(data.fxEffectiveDate)
              : "Not required"
          }
          description={`Unified totals in ${data.displayCurrency}`}
          icon={WalletCards}
          accent="amber"
        />
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-white/35">Loan being analyzed</p>

            <select
              value={selectedLoan.accountId}
              onChange={(event) => {
                setSelectedLoanId(event.target.value);
              }}
              className="mt-2 flex h-10 min-w-72 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white outline-none focus:border-cyan-300/40"
            >
              {data.loans.map((loan) => (
                <option
                  key={loan.accountId}
                  value={loan.accountId}
                  className="bg-[#0b0f17]"
                >
                  {loan.accountName} · {loan.currency}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="text-left sm:text-right">
              <p className="text-xs text-white/30">
                Current outstanding balance
              </p>

              <p className="mt-1 text-xl font-semibold text-violet-200">
                {formatCurrency(
                  selectedLoan.currentBalance,
                  selectedLoan.currency,
                )}
              </p>
            </div>

            <LoanProfileDialog loan={selectedLoan} />
          </div>
        </div>
      </section>

      {!profile ? (
        <section className="rounded-2xl border border-dashed border-violet-400/20 bg-violet-400/[0.035] px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-400/10">
            <TimerReset className="size-6 text-violet-300" />
          </div>

          <h2 className="mt-5 font-medium text-white">
            Configure repayment details
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/35">
            Add the current interest rate, required monthly payment, and next
            due date to generate the amortization schedule.
          </p>

          <div className="mt-6 flex justify-center">
            <LoanProfileDialog loan={selectedLoan} />
          </div>
        </section>
      ) : (
        <ConfiguredLoanOptimizer
          loan={selectedLoan}
          assumptions={assumptions}
          onAssumptionsChange={setAssumptions}
          onReset={() => {
            setAssumptions(DEFAULT_LOAN_OPTIMIZER_ASSUMPTIONS);
          }}
        />
      )}
    </div>
  );
}

function ConfiguredLoanOptimizer({
  loan,
  assumptions,
  onAssumptionsChange,
  onReset,
}: {
  loan: LoanDashboardData["loans"][number];

  assumptions: LoanOptimizerAssumptions;

  onAssumptionsChange: (assumptions: LoanOptimizerAssumptions) => void;

  onReset: () => void;
}) {
  const profile = loan.profile;

  if (!profile) {
    return null;
  }

  const comparison = useMemo(
    () =>
      buildLoanScenarioComparison({
        currentBalance: loan.currentBalance,

        annualInterestRate: profile.annualInterestRate,

        requiredMonthlyPayment: profile.requiredMonthlyPayment,

        nextPaymentDate: profile.nextPaymentDate,

        assumptions,
      }),
    [
      assumptions,
      loan.currentBalance,
      profile.annualInterestRate,
      profile.nextPaymentDate,
      profile.requiredMonthlyPayment,
    ],
  );

  const baseline = comparison.baseline;

  const accelerated = comparison.accelerated;

  const baselineIsInvalid = baseline.status === "not_paid_off";

  const acceleratedIsInvalid = accelerated.status === "not_paid_off";

  return (
    <>
      {(baselineIsInvalid || acceleratedIsInvalid) && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-5 py-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-300" />

          <div>
            <p className="text-sm font-medium text-red-200">
              Payment may not amortize the loan
            </p>

            <p className="mt-1 text-sm leading-6 text-red-100/55">
              The entered payment does not fully repay the balance within 600
              months. This usually means the payment is too low relative to the
              current balance and interest rate.
            </p>
          </div>
        </div>
      )}

      <LoanOptimizerControls
        currency={loan.currency}
        requiredMonthlyPayment={profile.requiredMonthlyPayment}
        assumptions={assumptions}
        onChange={onAssumptionsChange}
        onReset={onReset}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ScenarioCard
          title="Current balance"
          value={formatCurrency(loan.currentBalance, loan.currency)}
          description={`${profile.annualInterestRate.toFixed(
            3,
          )}% ${profile.rateType} APR`}
          icon={Landmark}
          accent="violet"
        />

        <ScenarioCard
          title="Required-payment payoff"
          value={
            baseline.payoffDate
              ? formatMonthYear(baseline.payoffDate)
              : "Not repaid"
          }
          description={
            baseline.monthsToPayoff !== null
              ? `${baseline.monthsToPayoff} future payments`
              : "Payment does not amortize within 600 months"
          }
          icon={CalendarCheck2}
          accent="cyan"
        />

        <ScenarioCard
          title="Baseline future interest"
          value={formatCurrency(baseline.totalInterest, loan.currency)}
          description="With the required payment only"
          icon={TrendingDown}
          accent="amber"
        />

        <ScenarioCard
          title="Accelerated payoff"
          value={
            accelerated.payoffDate
              ? formatMonthYear(accelerated.payoffDate)
              : "Not repaid"
          }
          description={
            accelerated.monthsToPayoff !== null
              ? `${accelerated.monthsToPayoff} future payments`
              : "Increase the scenario payment"
          }
          icon={PiggyBank}
          accent="emerald"
        />

        <ScenarioCard
          title="Interest saved"
          value={
            comparison.interestSaved !== null
              ? formatCurrency(comparison.interestSaved, loan.currency)
              : "Unavailable"
          }
          description="Compared with required payments"
          icon={CircleDollarSign}
          accent="emerald"
        />

        <ScenarioCard
          title="Time saved"
          value={
            comparison.monthsSaved !== null
              ? formatDuration(comparison.monthsSaved)
              : "Unavailable"
          }
          description="Reduction in remaining term"
          icon={TimerReset}
          accent="cyan"
        />
      </section>

      <LoanPayoffChart comparison={comparison} currency={loan.currency} />

      <AmortizationTable scenario={accelerated} currency={loan.currency} />

      <section className="grid gap-4 md:grid-cols-3">
        <HistoryCard
          title="Payments recorded"
          value={String(loan.paymentCount)}
        />

        <HistoryCard
          title="Recorded amount"
          value={formatCurrency(loan.totalPaymentsRecorded, loan.currency)}
        />

        <HistoryCard
          title="Last recorded payment"
          value={
            loan.lastPaymentDate
              ? formatShortDate(loan.lastPaymentDate)
              : "No payments recorded"
          }
        />
      </section>

      <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/55">
        This is an estimate based on monthly interest at the entered annual
        rate. Lender calculations may vary because of daily-interest methods,
        rate changes, fees, prepayment rules, rounding, and the exact number of
        days in each payment period.
      </div>
    </>
  );
}

type Accent = "cyan" | "emerald" | "amber" | "violet";

const accentClasses: Record<Accent, string> = {
  cyan: "bg-cyan-400/10 text-cyan-300",

  emerald: "bg-emerald-400/10 text-emerald-300",

  amber: "bg-amber-400/10 text-amber-300",

  violet: "bg-violet-400/10 text-violet-300",
};

function AggregateCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accent: Accent;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white/40">{title}</p>

          <p className="mt-3 truncate text-xl font-semibold text-white">
            {value}
          </p>
        </div>

        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            accentClasses[accent],
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/30">{description}</p>
    </article>
  );
}

const ScenarioCard = AggregateCard;

function HistoryCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <p className="text-xs text-white/30">{title}</p>

      <p className="mt-2 text-sm font-medium text-white/65">{value}</p>
    </article>
  );
}

function formatDuration(months: number): string {
  if (months <= 0) {
    return "0 months";
  }

  const years = Math.floor(months / 12);

  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  }

  return `${years} ${years === 1 ? "year" : "years"}, ${remainingMonths} ${
    remainingMonths === 1 ? "month" : "months"
  }`;
}

function formatMonthYear(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
