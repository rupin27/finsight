import { Landmark, Scale, ShieldCheck, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  ACCOUNT_CURRENCIES,
  type Account,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import { getAccounts } from "@/features/accounts/account-data";
import { AccountCard } from "@/features/accounts/components/account-card";
import { AddAccountDialog } from "@/features/accounts/components/add-account-dialog";
import { formatCurrency } from "@/lib/finance/currency";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { convertCurrencyTotals } from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";

interface AccountsPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

type CurrencyTotals = Record<AccountCurrency, number>;

export default async function AccountsPage({
  searchParams,
}: AccountsPageProps) {
  const params = await searchParams;
  const [accounts, displayCurrency] = await Promise.all([
    getAccounts(),
    getUserDefaultCurrency(),
  ]);

  const fxSnapshot = await getExchangeRateSnapshot(displayCurrency);

  const activeAccounts = accounts.filter((account) => account.isActive);

  const assetAccounts = activeAccounts.filter(
    (account) => account.accountType !== "loan",
  );

  const liabilityAccounts = activeAccounts.filter(
    (account) => account.accountType === "loan",
  );

  const assetTotals = calculateCurrencyTotals(assetAccounts);

  const liabilityTotals = calculateCurrencyTotals(liabilityAccounts);

  const netTotals = createEmptyTotals();

  const convertedAssetTotal = convertCurrencyTotals(
    assetTotals,
    displayCurrency,
    fxSnapshot,
  );

  const convertedLiabilityTotal = convertCurrencyTotals(
    liabilityTotals,
    displayCurrency,
    fxSnapshot,
  );

  const convertedNetTotal = convertCurrencyTotals(
    netTotals,
    displayCurrency,
    fxSnapshot,
  );

  for (const currency of ACCOUNT_CURRENCIES) {
    netTotals[currency] = assetTotals[currency] - liabilityTotals[currency];
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
            <ShieldCheck className="size-3.5" />
            Secure account management
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Financial accounts
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Track your bank balances across India, the United States and
            Ireland, along with your outstanding student loan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DisplayCurrencySelector value={displayCurrency} />

          <AddAccountDialog />
        </div>
      </header>

      {params.error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {params.error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active accounts"
          value={String(activeAccounts.length)}
          description={`${assetAccounts.length} assets · ${liabilityAccounts.length} liabilities`}
          icon={WalletCards}
        />

        <CurrencySummaryCard
          title="Assets"
          totals={assetTotals}
          displayValue={convertedAssetTotal}
          displayCurrency={displayCurrency}
          icon={WalletCards}
        />

        <CurrencySummaryCard
          title="Liabilities"
          totals={liabilityTotals}
          displayValue={convertedLiabilityTotal}
          displayCurrency={displayCurrency}
          icon={Landmark}
        />

        <CurrencySummaryCard
          title="Net position"
          totals={netTotals}
          displayValue={convertedNetTotal}
          displayCurrency={displayCurrency}
          icon={Scale}
        />
      </section>

      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] px-5 py-4 text-sm leading-6 text-amber-100/65">
        Currency totals are currently kept separate so FinSight never adds USD,
        EUR and INR as though they were equivalent. Live FX normalization will
        be added in the currency milestone.
      </div>

      {accounts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
            <WalletCards className="size-6 text-cyan-300" />
          </div>

          <h2 className="mt-5 font-medium text-white">
            Add your first financial account
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
            Start with your primary bank account, then add your Indian, Irish
            and US accounts and student loan.
          </p>

          <div className="mt-6 flex justify-center">
            <AddAccountDialog />
          </div>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </section>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40">{title}</p>

          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <Icon className="size-[18px]" />
        </div>
      </div>

      <p className="mt-3 text-xs text-white/30">{description}</p>
    </article>
  );
}

interface CurrencySummaryCardProps {
  title: string;
  totals: CurrencyTotals;
  displayValue: number;
  displayCurrency: AccountCurrency;
  icon: LucideIcon;
}

function CurrencySummaryCard({
  title,
  totals,
  displayValue,
  displayCurrency,
  icon: Icon,
}: CurrencySummaryCardProps) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/40">{title}</p>

          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(displayValue, displayCurrency)}
          </p>
        </div>

        <div className="flex size-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
          <Icon className="size-[18px]" />
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
        {ACCOUNT_CURRENCIES.map((currency) => (
          <div
            key={currency}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <span className="text-white/25">{currency}</span>

            <span className="text-white/45">
              {formatCurrency(totals[currency], currency)}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function createEmptyTotals(): CurrencyTotals {
  return {
    USD: 0,
    EUR: 0,
    INR: 0,
  };
}

function calculateCurrencyTotals(accounts: Account[]): CurrencyTotals {
  const totals = createEmptyTotals();

  for (const account of accounts) {
    totals[account.currency] += account.currentBalance;
  }

  return totals;
}
