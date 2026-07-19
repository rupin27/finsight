import type { AccountCurrency } from "@/features/accounts/account.types";

export type FxRates = Record<AccountCurrency, number>;

export interface FxRateSnapshot {
  base: AccountCurrency;
  effectiveDate: string;
  requestedDate: string | null;
  rates: FxRates;
  source: "Frankfurter";
}

export interface FxConversionResponse {
  success: boolean;
  error?: string;

  amount?: number;
  convertedAmount?: number;

  from?: AccountCurrency;
  to?: AccountCurrency;

  rate?: number;
  effectiveDate?: string;
  requestedDate?: string | null;
}
