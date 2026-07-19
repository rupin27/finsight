import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  Repeat2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import { getAccounts } from "@/features/accounts/account-data";
import type {
  TransactionFilters,
  TransactionKind,
} from "@/features/transactions/transaction.types";
import {
  getMonthlyTransactionSummary,
  getTransactionCategories,
  getTransactions,
} from "@/features/transactions/transaction-data";
import { AddTransactionDialog } from "@/features/transactions/components/add-transaction-dialog";
import { TransactionFilters as TransactionFiltersForm } from "@/features/transactions/components/transaction-filters";
import { TransactionTable } from "@/features/transactions/components/transaction-table";
import { getRecentCsvImports } from "@/features/transactions/csv-import-data";
import { CsvImportDialog } from "@/features/transactions/components/csv-import-dialog";
import { CsvImportHistory } from "@/features/transactions/components/csv-import-history";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance/currency";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { convertCurrencyTotals } from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";
import { cn } from "@/lib/utils";

interface TransactionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  const filters = parseTransactionFilters(params);

  const [
    accounts,
    categories,
    transactions,
    monthlySummary,
    recentImports,
    displayCurrency,
  ] = await Promise.all([
    getAccounts(),
    getTransactionCategories(),
    getTransactions(filters),
    getMonthlyTransactionSummary(),
    getRecentCsvImports(),
    getUserDefaultCurrency(),
  ]);

  const fxSnapshot = await getExchangeRateSnapshot(displayCurrency);

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

  const hasSourceAccount = accounts.some(
    (account) => account.isActive && account.accountType !== "loan",
  );

  const error = firstString(params.error);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
            <ShieldCheck className="size-3.5" />
            Secure financial records
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Transactions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Record your income, expenses, recurring payments, and student-loan
            payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DisplayCurrencySelector value={displayCurrency} />

          <CsvImportDialog accounts={accounts} categories={categories} />

          <AddTransactionDialog accounts={accounts} categories={categories} />
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Monthly income"
          value={formatCurrency(convertedMonthlyIncome, displayCurrency)}
          description={formatCurrencyBreakdown(monthlySummary.incomeTotals)}
          icon={ArrowDownLeft}
          accent="emerald"
        />

        <SummaryCard
          title="Monthly spending"
          value={formatCurrency(convertedMonthlySpending, displayCurrency)}
          description={formatCurrencyBreakdown(monthlySummary.spendingTotals)}
          icon={ArrowUpRight}
          accent="amber"
        />

        <SummaryCard
          title="This month"
          value={String(monthlySummary.transactionCount)}
          description={
            monthlySummary.transactionCount === 1
              ? "Recorded transaction"
              : "Recorded transactions"
          }
          icon={ReceiptText}
          accent="cyan"
        />

        <SummaryCard
          title="Recurring"
          value={String(monthlySummary.recurringCount)}
          description="Recurring records this month"
          icon={Repeat2}
          accent="violet"
        />
      </section>

      {!hasSourceAccount ? (
        <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
            <WalletCards className="size-6 text-cyan-300" />
          </div>

          <h2 className="mt-5 font-medium text-white">
            Add a bank or cash account first
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
            Transactions require an active checking, savings, or cash account.
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
      ) : (
        <>
          <TransactionFiltersForm
            filters={filters}
            accounts={accounts}
            categories={categories}
          />

          {transactions.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
                <ReceiptText className="size-6 text-cyan-300" />
              </div>

              <h2 className="mt-5 font-medium text-white">
                No transactions found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
                Add your first transaction or clear the current filters.
              </p>

              <div className="mt-6 flex justify-center">
                <AddTransactionDialog
                  accounts={accounts}
                  categories={categories}
                />
              </div>
            </section>
          ) : (
            <>
              <p className="text-sm text-white/30">
                Showing {transactions.length} matching{" "}
                {transactions.length === 1 ? "transaction" : "transactions"}.
                The initial view is limited to the most recent 250 records.
              </p>

              <TransactionTable
                transactions={transactions}
                accounts={accounts}
                categories={categories}
              />
            </>
          )}
        </>
      )}
      <CsvImportHistory imports={recentImports} accounts={accounts} />
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accent: "cyan" | "emerald" | "amber" | "violet";
}

const accentClasses = {
  cyan: "bg-cyan-400/10 text-cyan-300",
  emerald: "bg-emerald-400/10 text-emerald-300",
  amber: "bg-amber-400/10 text-amber-300",
  violet: "bg-violet-400/10 text-violet-300",
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40">{title}</p>

          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>

        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            accentClasses[accent],
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="mt-3 truncate text-xs text-white/30">{description}</p>
    </article>
  );
}

function parseTransactionFilters(
  params: Record<string, string | string[] | undefined>,
): TransactionFilters {
  const kind = firstString(params.kind);

  const validKinds: TransactionKind[] = ["income", "expense", "loan_payment"];

  return {
    query: firstString(params.q)?.trim() || undefined,

    transactionKind:
      kind && validKinds.includes(kind as TransactionKind)
        ? (kind as TransactionKind)
        : undefined,

    accountId: firstString(params.account) || undefined,

    categoryId: firstString(params.category) || undefined,

    dateFrom: firstString(params.from) || undefined,

    dateTo: firstString(params.to) || undefined,
  };
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatCurrencyBreakdown(
  totals: Record<AccountCurrency, number>,
): string {
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
