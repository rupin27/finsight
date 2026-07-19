import {
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  DatabaseZap,
} from "lucide-react";

import { ACCOUNT_CURRENCIES } from "@/features/accounts/account.types";
import { getUserDefaultCurrency } from "@/features/currency/currency-data";
import { CurrencyConverter } from "@/features/currency/components/currency-converter";
import { DisplayCurrencySelector } from "@/features/currency/components/display-currency-selector";
import { calculateConversionRate } from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";

export default async function CurrencyPage() {
  const displayCurrency = await getUserDefaultCurrency();

  const snapshot = await getExchangeRateSnapshot(displayCurrency);

  const targetCurrencies = ACCOUNT_CURRENCIES.filter(
    (currency) => currency !== displayCurrency,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
            <BadgeDollarSign className="size-3.5" />
            USD · EUR · INR
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
            Currency conversion
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
            Convert balances and historical transactions while preserving every
            record in its original currency.
          </p>
        </div>

        <DisplayCurrencySelector value={displayCurrency} />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {targetCurrencies.map((targetCurrency) => {
          const rate = calculateConversionRate(
            displayCurrency,
            targetCurrency,
            snapshot,
          );

          const inverseRate = calculateConversionRate(
            targetCurrency,
            displayCurrency,
            snapshot,
          );

          return (
            <article
              key={targetCurrency}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/35">
                    Current reference rate
                  </p>

                  <p className="mt-3 text-2xl font-semibold text-white">
                    1 {displayCurrency}
                    <ArrowRight className="mx-2 inline size-4 text-cyan-300" />
                    {formatRate(rate)} {targetCurrency}
                  </p>
                </div>

                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <BadgeDollarSign className="size-5" />
                </div>
              </div>

              <p className="mt-4 text-xs text-white/30">
                1 {targetCurrency} = {formatRate(inverseRate)} {displayCurrency}
              </p>
            </article>
          );
        })}
      </section>

      <CurrencyConverter defaultCurrency={displayCurrency} />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 text-violet-300" />

            <div>
              <h2 className="font-medium text-white">Effective rate date</h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Latest available reference rates are dated{" "}
                {formatDate(snapshot.effectiveDate)}.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="flex items-start gap-3">
            <DatabaseZap className="mt-0.5 size-5 text-emerald-300" />

            <div>
              <h2 className="font-medium text-white">Data handling</h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Rates are fetched server-side and cached. Your bank balances and
                transactions are never sent to the exchange-rate provider.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function formatRate(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(rate);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
