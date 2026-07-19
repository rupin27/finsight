"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, LoaderCircle } from "lucide-react";

import { updateDefaultCurrency } from "@/app/(dashboard)/settings/actions";
import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import { cn } from "@/lib/utils";

interface DisplayCurrencySelectorProps {
  value: AccountCurrency;
  compact?: boolean;
  className?: string;
}

export function DisplayCurrencySelector({
  value,
  compact = false,
  className,
}: DisplayCurrencySelectorProps) {
  const router = useRouter();

  const [currency, setCurrency] = useState<AccountCurrency>(value);

  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  function handleCurrencyChange(nextCurrency: AccountCurrency) {
    const previousCurrency = currency;

    setCurrency(nextCurrency);
    setError(null);

    startTransition(async () => {
      const result = await updateDefaultCurrency(nextCurrency);

      if (!result.success) {
        setCurrency(previousCurrency);

        setError(result.error ?? "The display currency could not be updated.");

        return;
      }

      router.refresh();
    });
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        {!compact && (
          <span className="text-sm text-white/40">Display currency</span>
        )}

        <div className="relative">
          <select
            value={currency}
            disabled={isPending}
            aria-label="Dashboard display currency"
            onChange={(event) => {
              handleCurrencyChange(event.target.value as AccountCurrency);
            }}
            className={cn(
              "h-10 appearance-none rounded-xl border border-white/[0.08] bg-white/[0.035] pl-3 pr-9 text-sm font-medium text-white outline-none transition-colors hover:bg-white/[0.06] focus:border-cyan-300/30",
              compact && "h-9 text-xs",
            )}
          >
            {ACCOUNT_CURRENCIES.map((currencyOption) => (
              <option
                key={currencyOption}
                value={currencyOption}
                className="bg-[#0b0f17]"
              >
                {currencyOption}
              </option>
            ))}
          </select>

          {isPending && (
            <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-cyan-300" />
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
          <CircleAlert className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}
