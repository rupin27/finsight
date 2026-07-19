import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  ACCOUNT_CURRENCIES,
  type Account,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import { getAccounts } from "@/features/accounts/account-data";
import { getMonthlyTransactionSummary } from "@/features/transactions/transaction-data";
import { MetricCard } from "@/components/dashboard/metric-card";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { convertCurrencyTotals } from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";
import { getProjectionPageData } from "@/features/projections/projection-data";
import {
  buildProjection,
  DEFAULT_PROJECTION_ASSUMPTIONS,
} from "@/features/projections/projection-engine";
import { ProjectionChart } from "@/features/projections/components/projection-chart";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

type CurrencyTotals = Record<AccountCurrency, number>;

export default async function OverviewPage() {
  const [accounts, monthlySummary, displayCurrency, projectionData] =
    await Promise.all([
      getAccounts(),
      getMonthlyTransactionSummary(),
      getUserDefaultCurrency(),
      getProjectionPageData(),
    ]);

  const fxSnapshot = await getExchangeRateSnapshot(displayCurrency);

  const sixMonthProjection = buildProjection({
    openingBalance: projectionData.openingBalance,

    recurringItems: projectionData.recurringItems,

    assumptions: DEFAULT_PROJECTION_ASSUMPTIONS,
  });

  const activeAccounts = accounts.filter((account) => account.isActive);

  const assetAccounts = activeAccounts.filter(
    (account) => account.accountType !== "loan",
  );

  const loanAccounts = activeAccounts.filter(
    (account) => account.accountType === "loan",
  );

  const assetTotals = calculateCurrencyTotals(assetAccounts);

  const loanTotals = calculateCurrencyTotals(loanAccounts);

  const convertedAssetTotal = convertCurrencyTotals(
    assetTotals,
    displayCurrency,
    fxSnapshot,
  );

  const convertedLoanTotal = convertCurrencyTotals(
    loanTotals,
    displayCurrency,
    fxSnapshot,
  );

  const convertedMonthlyIncome = convertCurrencyTotals(
    monthlySummary.incomeTotals,
    displayCurrency,
    fxSnapshot,
  );

  const convertedMonthlySpending = convertCurrencyTotals(
    monthlySummary.spendingTotals,
    displayCurrency,
    fxSnapshot,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-cyan-400/20 bg-cyan-400/5 text-cyan-200"
            >
              Financial overview
            </Badge>
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Good morning, Rupin
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Review your accounts, monthly activity, financial goals, and
            developing cash-flow picture.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DisplayCurrencySelector value={displayCurrency} />
          <Link
            href="/transactions"
            className={cn(
              buttonVariants(),
              "h-10 bg-cyan-300 text-slate-950 hover:bg-cyan-200",
            )}
          >
            <Plus data-icon="inline-start" className="size-4" />
            Add transaction
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total assets"
          value={formatCurrency(convertedAssetTotal, displayCurrency)}
          description={`${assetAccounts.length} ${
            assetAccounts.length === 1 ? "active account" : "active accounts"
          } · Rates ${formatFxDate(fxSnapshot.effectiveDate)}`}
          icon={WalletCards}
          accent="cyan"
        />

        <MetricCard
          title="Monthly income"
          value={formatCurrency(convertedMonthlyIncome, displayCurrency)}
          description={formatCurrencyBreakdown(monthlySummary.incomeTotals)}
          icon={TrendingUp}
          accent="emerald"
        />

        <MetricCard
          title="Monthly spending"
          value={formatCurrency(convertedMonthlySpending, displayCurrency)}
          description={formatCurrencyBreakdown(monthlySummary.spendingTotals)}
          icon={TrendingDown}
          accent="amber"
        />

        <MetricCard
          title="Student loans"
          value={formatCurrency(convertedLoanTotal, displayCurrency)}
          description={
            loanAccounts.length > 0
              ? formatCurrencyBreakdown(loanTotals)
              : "Add your loan to track payoff"
          }
          icon={Landmark}
          accent="violet"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)]">
        <article className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-medium text-white">Cash-flow outlook</h2>

              <p className="mt-1 text-sm text-white/35">
                Your projected income, expenses, and savings over the next six
                months.
              </p>
            </div>

            <Link
              href="/projections"
              className="inline-flex items-center gap-2 text-xs font-medium text-cyan-300 hover:text-cyan-200"
            >
              Next 6 months
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {projectionData.recurringItems.length === 0 ? (
            <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden p-6">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
                  backgroundSize: "56px 56px",
                }}
              />

              <div className="relative max-w-sm text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                  <CircleDollarSign className="size-6 text-cyan-300" />
                </div>

                <h3 className="mt-5 font-medium text-white">
                  Build your recurring history
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/35">
                  Mark salaries, rent, regular expenses, and loan payments as
                  recurring. FinSight will use them to generate your savings
                  projection.
                </p>

                <Link
                  href="/transactions"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Manage transactions
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
                  <p className="text-xs text-white/30">Ending balance</p>

                  <p
                    className={
                      sixMonthProjection.summary.endingBalance >= 0
                        ? "mt-2 font-medium text-white"
                        : "mt-2 font-medium text-red-300"
                    }
                  >
                    {formatCurrency(
                      sixMonthProjection.summary.endingBalance,
                      displayCurrency,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
                  <p className="text-xs text-white/30">
                    Average monthly savings
                  </p>

                  <p
                    className={
                      sixMonthProjection.summary.averageMonthlySavings >= 0
                        ? "mt-2 font-medium text-emerald-300"
                        : "mt-2 font-medium text-red-300"
                    }
                  >
                    {sixMonthProjection.summary.averageMonthlySavings > 0
                      ? "+"
                      : ""}
                    {formatCurrency(
                      sixMonthProjection.summary.averageMonthlySavings,
                      displayCurrency,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
                  <p className="text-xs text-white/30">Risk status</p>

                  <p
                    className={
                      sixMonthProjection.summary.negativeBalanceMonth
                        ? "mt-2 font-medium text-red-300"
                        : "mt-2 font-medium text-emerald-300"
                    }
                  >
                    {sixMonthProjection.summary.negativeBalanceMonth
                      ? `Negative in ${sixMonthProjection.summary.negativeBalanceMonth}`
                      : "Balance remains positive"}
                  </p>
                </div>
              </div>

              <ProjectionChart
                months={sixMonthProjection.months}
                currency={displayCurrency}
              />

              <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-white/30">
                  Based on {projectionData.recurringItems.length} recurring{" "}
                  {projectionData.recurringItems.length === 1
                    ? "schedule"
                    : "schedules"}
                  .
                </p>

                <Link
                  href="/projections"
                  className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Open full projection
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-violet-400/[0.06] to-white/[0.02] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white">Financial coach</p>

              <p className="mt-1 text-xs text-white/35">
                Personalized insights
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-400/10">
              <Sparkles className="size-[18px] text-violet-300" />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/[0.07] bg-black/15 p-5">
            <p className="text-sm leading-6 text-white/55">
              You have recorded {monthlySummary.transactionCount} transactions
              this month. Continue adding and categorizing activity to unlock
              meaningful trends and forecasts.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {[
              {
                icon: CreditCard,
                text: "Automatic expense categories",
              },
              {
                icon: Target,
                text: "Savings and payoff guidance",
              },
              {
                icon: TrendingUp,
                text: "Monthly spending forecasts",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.05] px-3 py-3"
                >
                  <Icon className="size-4 text-violet-300" />

                  <span className="text-xs text-white/40">{item.text}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "Student-loan payoff",
            description:
              "Track your current balance and simulate additional payments.",
            icon: Landmark,
            href: "/loans",
          },
          {
            title: "Monthly savings",
            description:
              "Choose a monthly savings target and monitor your progress.",
            icon: CircleDollarSign,
            href: "/goals",
          },
          {
            title: "Post-graduation runway",
            description:
              "Estimate how many months your available savings can support.",
            icon: Target,
            href: "/goals",
          },
        ].map((goal) => {
          const Icon = goal.icon;

          return (
            <Link
              key={goal.title}
              href={goal.href}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Icon className="size-[18px] text-white/60" />
                </div>

                <ArrowRight className="size-4 text-white/20 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
              </div>

              <h3 className="mt-5 font-medium text-white">{goal.title}</h3>

              <p className="mt-2 text-sm leading-6 text-white/35">
                {goal.description}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function calculateCurrencyTotals(accounts: Account[]): CurrencyTotals {
  const totals: CurrencyTotals = {
    USD: 0,
    EUR: 0,
    INR: 0,
  };

  for (const account of accounts) {
    totals[account.currency] += account.currentBalance;
  }

  return totals;
}

function formatSummaryValue(totals: CurrencyTotals): string {
  const currencies = ACCOUNT_CURRENCIES.filter(
    (currency) => totals[currency] !== 0,
  );

  if (currencies.length === 0) {
    return "$0.00";
  }

  if (currencies.length === 1) {
    const currency = currencies[0];

    return formatCurrency(totals[currency], currency);
  }

  return `${currencies.length} currencies`;
}

function formatCurrencyBreakdown(totals: CurrencyTotals): string {
  const currencies = ACCOUNT_CURRENCIES.filter(
    (currency) => totals[currency] !== 0,
  );

  if (currencies.length === 0) {
    return "No activity recorded";
  }

  return currencies
    .map((currency) => formatCurrency(totals[currency], currency))
    .join(" · ");
}

function formatAccountCount(count: number): string {
  return `${count} ${count === 1 ? "account" : "accounts"}`;
}

function formatLoanCount(count: number): string {
  return `${count} ${count === 1 ? "loan" : "loans"}`;
}

function formatFxDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
