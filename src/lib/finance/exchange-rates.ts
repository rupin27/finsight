import { z } from "zod";

import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import type {
  FxRateSnapshot,
  FxRates,
} from "@/features/currency/currency.types";

const FRANKFURTER_API_URL = "https://api.frankfurter.dev/v2/rates";

const LATEST_RATE_REVALIDATION_SECONDS = 6 * 60 * 60;

const HISTORICAL_RATE_REVALIDATION_SECONDS = 30 * 24 * 60 * 60;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "The rate date must use YYYY-MM-DD.");

const rateRowSchema = z.object({
  date: z.string(),
  base: z.enum(ACCOUNT_CURRENCIES),
  quote: z.enum(ACCOUNT_CURRENCIES),
  rate: z.number().positive(),
});

const rateRowsSchema = z.array(rateRowSchema);

export async function getExchangeRateSnapshot(
  base: AccountCurrency,
  date?: string,
): Promise<FxRateSnapshot> {
  const parsedBase = z.enum(ACCOUNT_CURRENCIES).safeParse(base);

  if (!parsedBase.success) {
    throw new Error(`Unsupported base currency: ${base}`);
  }

  if (date) {
    const parsedDate = dateSchema.safeParse(date);

    if (!parsedDate.success) {
      throw new Error(
        parsedDate.error.issues[0]?.message ?? "The rate date is invalid.",
      );
    }

    if (date > getTodayIso()) {
      throw new Error("Exchange rates cannot be requested for a future date.");
    }
  }

  const quoteCurrencies = ACCOUNT_CURRENCIES.filter(
    (currency) => currency !== base,
  );

  const url = new URL(FRANKFURTER_API_URL);

  url.searchParams.set("base", base);

  url.searchParams.set("quotes", quoteCurrencies.join(","));

  if (date) {
    url.searchParams.set("date", date);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },

    next: {
      revalidate: date
        ? HISTORICAL_RATE_REVALIDATION_SECONDS
        : LATEST_RATE_REVALIDATION_SECONDS,

      tags: [date ? `fx:${base}:${date}` : `fx:${base}:latest`],
    },
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Exchange-rate provider returned HTTP ${response.status}: ${responseBody}`,
    );
  }

  const responseBody: unknown = await response.json();

  const parsedRows = rateRowsSchema.safeParse(responseBody);

  if (!parsedRows.success) {
    console.error("[fx] Unexpected Frankfurter response:", responseBody);

    throw new Error(
      "The exchange-rate provider returned an unexpected response.",
    );
  }

  const rates = createIdentityRates();

  for (const row of parsedRows.data) {
    if (row.base !== base) {
      continue;
    }

    rates[row.quote] = row.rate;
  }

  for (const currency of quoteCurrencies) {
    if (!Number.isFinite(rates[currency]) || rates[currency] <= 0) {
      throw new Error(`No ${base}/${currency} exchange rate was returned.`);
    }
  }

  const effectiveDate = parsedRows.data[0]?.date;

  if (!effectiveDate) {
    throw new Error(
      "The exchange-rate provider did not return an effective date.",
    );
  }

  return {
    base,
    effectiveDate,
    requestedDate: date ?? null,
    rates,
    source: "Frankfurter",
  };
}

function createIdentityRates(): FxRates {
  return {
    USD: 1,
    EUR: 1,
    INR: 1,
  };
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
