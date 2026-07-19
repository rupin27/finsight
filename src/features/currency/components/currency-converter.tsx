"use client";

import { useState } from "react";
import { ArrowRightLeft, CalendarDays, LoaderCircle } from "lucide-react";

import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import type { FxConversionResponse } from "@/features/currency/currency.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/finance/currency";

interface CurrencyConverterProps {
  defaultCurrency: AccountCurrency;
}

export function CurrencyConverter({ defaultCurrency }: CurrencyConverterProps) {
  const initialTargetCurrency = defaultCurrency === "USD" ? "EUR" : "USD";

  const [amount, setAmount] = useState("1000");

  const [from, setFrom] = useState<AccountCurrency>(defaultCurrency);

  const [to, setTo] = useState<AccountCurrency>(initialTargetCurrency);

  const [date, setDate] = useState("");

  const [result, setResult] = useState<FxConversionResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function convert() {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        amount: String(numericAmount),
        from,
        to,
      });

      if (date) {
        searchParams.set("date", date);
      }

      const response = await fetch(`/api/fx?${searchParams.toString()}`);

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `The conversion service returned HTTP ${response.status}.`,
        );
      }

      const responseBody = (await response.json()) as FxConversionResponse;

      if (!response.ok || !responseBody.success) {
        setError(responseBody.error ?? "The currency conversion failed.");

        return;
      }

      setResult(responseBody);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "FinSight could not reach the currency service.",
      );
    } finally {
      setLoading(false);
    }
  }

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
    setResult(null);
    setError(null);
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-medium text-white">Currency converter</h2>

        <p className="mt-1 text-sm text-white/35">
          Convert using the latest available rate or choose a historical date.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_180px_auto_180px]">
        <div className="space-y-2">
          <Label htmlFor="conversionAmount" className="text-white/65">
            Amount
          </Label>

          <Input
            id="conversionAmount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
            }}
            className="border-white/10 bg-white/[0.04] text-white"
          />
        </div>

        <CurrencySelect
          id="fromCurrency"
          label="From"
          value={from}
          onChange={setFrom}
        />

        <div className="flex items-end justify-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Swap currencies"
            onClick={swapCurrencies}
            className="border-white/10 bg-transparent text-white/50 hover:bg-white/[0.06] hover:text-cyan-300"
          >
            <ArrowRightLeft className="size-4" />
          </Button>
        </div>

        <CurrencySelect
          id="toCurrency"
          label="To"
          value={to}
          onChange={setTo}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="max-w-xs space-y-2">
          <Label htmlFor="conversionDate" className="text-white/65">
            Historical date
          </Label>

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />

            <Input
              id="conversionDate"
              type="date"
              max={getTodayIso()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
              }}
              className="border-white/10 bg-white/[0.04] pl-9 text-white [color-scheme:dark]"
            />
          </div>

          <p className="text-xs text-white/25">
            Leave blank for the latest available rate.
          </p>
        </div>

        <Button
          type="button"
          disabled={loading}
          onClick={() => {
            void convert();
          }}
          className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          Convert
        </Button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {result &&
        result.success &&
        result.convertedAmount !== undefined &&
        result.amount !== undefined &&
        result.from !== undefined &&
        result.to !== undefined &&
        result.rate !== undefined && (
          <div className="mt-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.045] p-5">
            <p className="text-sm text-white/40">Conversion result</p>

            <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {formatCurrency(result.amount, result.from)}

              <span className="mx-3 text-white/20">=</span>

              {formatCurrency(result.convertedAmount, result.to)}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/35">
              <span>
                1 {result.from} = {formatRate(result.rate)} {result.to}
              </span>

              <span>
                Effective date: {formatRateDate(result.effectiveDate)}
              </span>
            </div>
          </div>
        )}
    </section>
  );
}

interface CurrencySelectProps {
  id: string;
  label: string;
  value: AccountCurrency;
  onChange: (currency: AccountCurrency) => void;
}

function CurrencySelect({ id, label, value, onChange }: CurrencySelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/65">
        {label}
      </Label>

      <select
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value as AccountCurrency);
        }}
        className="flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
      >
        {ACCOUNT_CURRENCIES.map((currency) => (
          <option key={currency} value={currency} className="bg-[#0b0f17]">
            {currency}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatRate(rate: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(rate);
}

function formatRateDate(value?: string): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getTodayIso(): string {
  const now = new Date();

  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}
