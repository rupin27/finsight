import type { AccountCurrency } from "@/features/accounts/account.types";

const CURRENCY_LOCALES: Record<AccountCurrency, string> = {
  USD: "en-US",
  EUR: "en-IE",
  INR: "en-IN",
};

interface FormatCurrencyOptions {
  compact?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  amount: number,
  currency: AccountCurrency,
  options: FormatCurrencyOptions = {},
): string {
  const {
    compact = false,
    minimumFractionDigits = compact ? 0 : 2,
    maximumFractionDigits = compact ? 1 : 2,
  } = options;

  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}
