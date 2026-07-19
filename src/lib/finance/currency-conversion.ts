import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import type { FxRateSnapshot } from "@/features/currency/currency.types";

export type CurrencyTotals = Record<AccountCurrency, number>;

export function createEmptyCurrencyTotals(): CurrencyTotals {
  return {
    USD: 0,
    EUR: 0,
    INR: 0,
  };
}

export function convertAmount(
  amount: number,
  from: AccountCurrency,
  to: AccountCurrency,
  snapshot: FxRateSnapshot,
): number {
  if (!Number.isFinite(amount)) {
    throw new Error("The amount must be a finite number.");
  }

  if (from === to) {
    return amount;
  }

  const fromRate = snapshot.rates[from];

  const toRate = snapshot.rates[to];

  if (!Number.isFinite(fromRate) || fromRate <= 0) {
    throw new Error(`No conversion rate is available for ${from}.`);
  }

  if (!Number.isFinite(toRate) || toRate <= 0) {
    throw new Error(`No conversion rate is available for ${to}.`);
  }

  /*
   * snapshot.rates[currency] means:
   *
   * 1 snapshot.base = rate currency
   *
   * Convert from the original currency into
   * the snapshot base, then into the target.
   */
  const amountInBase = from === snapshot.base ? amount : amount / fromRate;

  return to === snapshot.base ? amountInBase : amountInBase * toRate;
}

export function convertCurrencyTotals(
  totals: CurrencyTotals,
  targetCurrency: AccountCurrency,
  snapshot: FxRateSnapshot,
): number {
  return ACCOUNT_CURRENCIES.reduce((total, currency) => {
    return (
      total +
      convertAmount(totals[currency], currency, targetCurrency, snapshot)
    );
  }, 0);
}

export function calculateConversionRate(
  from: AccountCurrency,
  to: AccountCurrency,
  snapshot: FxRateSnapshot,
): number {
  return convertAmount(1, from, to, snapshot);
}

export function roundCurrencyAmount(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
