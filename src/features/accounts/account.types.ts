export const ACCOUNT_TYPES = ["checking", "savings", "cash", "loan"] as const;

export const ACCOUNT_COUNTRIES = ["US", "IE", "IN"] as const;

export const ACCOUNT_CURRENCIES = ["USD", "EUR", "INR"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type AccountCountry = (typeof ACCOUNT_COUNTRIES)[number];

export type AccountCurrency = (typeof ACCOUNT_CURRENCIES)[number];

export interface Account {
  id: string;
  name: string;
  institution: string | null;
  accountType: AccountType;
  country: AccountCountry;
  currency: AccountCurrency;

  openingBalance: number;
  openingBalanceDate: string;

  currentBalance: number;
  transactionCount: number;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking account",
  savings: "Savings account",
  cash: "Cash",
  loan: "Loan",
};

export const ACCOUNT_COUNTRY_LABELS: Record<AccountCountry, string> = {
  US: "United States",
  IE: "Ireland",
  IN: "India",
};

export const ACCOUNT_CURRENCY_LABELS: Record<AccountCurrency, string> = {
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  INR: "INR — Indian Rupee",
};
