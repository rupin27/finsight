"use client";

import { useState } from "react";

import {
  ACCOUNT_COUNTRIES,
  ACCOUNT_COUNTRY_LABELS,
  ACCOUNT_CURRENCIES,
  ACCOUNT_CURRENCY_LABELS,
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
} from "@/features/accounts/account.types";
import type { AccountFieldErrors } from "@/features/accounts/account-validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AccountFormFieldsProps {
  defaultValues?: Partial<Account>;
  fieldErrors?: AccountFieldErrors;
}

interface FieldErrorProps {
  errors?: string[];
}

function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-red-300">{errors[0]}</p>;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50";

export function AccountFormFields({
  defaultValues,
  fieldErrors,
}: AccountFormFieldsProps) {
  const [accountType, setAccountType] = useState<AccountType>(
    defaultValues?.accountType ?? "checking",
  );

  const balanceLabel =
    accountType === "loan" ? "Current amount owed" : "Current balance";

  const balanceHelp =
    accountType === "loan"
      ? "Enter the amount currently outstanding as a positive number."
      : "Enter the balance on the selected balance date.";

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name" className="text-white/70">
          Account name
        </Label>

        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Example: Chase Checking"
          aria-invalid={Boolean(fieldErrors?.name?.length)}
          required
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />

        <FieldError errors={fieldErrors?.name} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="institution" className="text-white/70">
          Institution
        </Label>

        <Input
          id="institution"
          name="institution"
          type="text"
          defaultValue={defaultValues?.institution ?? ""}
          placeholder="Example: Chase, AIB or HDFC"
          aria-invalid={Boolean(fieldErrors?.institution?.length)}
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />

        <FieldError errors={fieldErrors?.institution} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountType" className="text-white/70">
          Account type
        </Label>

        <select
          id="accountType"
          name="accountType"
          value={accountType}
          onChange={(event) => {
            setAccountType(event.target.value as AccountType);
          }}
          aria-invalid={Boolean(fieldErrors?.accountType?.length)}
          className={cn(
            selectClassName,
            fieldErrors?.accountType?.length && "border-red-400/40",
          )}
        >
          {ACCOUNT_TYPES.map((type) => (
            <option key={type} value={type} className="bg-[#0b0f17]">
              {ACCOUNT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <FieldError errors={fieldErrors?.accountType} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country" className="text-white/70">
          Country
        </Label>

        <select
          id="country"
          name="country"
          defaultValue={defaultValues?.country ?? "US"}
          aria-invalid={Boolean(fieldErrors?.country?.length)}
          className={cn(
            selectClassName,
            fieldErrors?.country?.length && "border-red-400/40",
          )}
        >
          {ACCOUNT_COUNTRIES.map((country) => (
            <option key={country} value={country} className="bg-[#0b0f17]">
              {ACCOUNT_COUNTRY_LABELS[country]}
            </option>
          ))}
        </select>

        <FieldError errors={fieldErrors?.country} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency" className="text-white/70">
          Currency
        </Label>

        <select
          id="currency"
          name="currency"
          defaultValue={defaultValues?.currency ?? "USD"}
          aria-invalid={Boolean(fieldErrors?.currency?.length)}
          className={cn(
            selectClassName,
            fieldErrors?.currency?.length && "border-red-400/40",
          )}
        >
          {ACCOUNT_CURRENCIES.map((currency) => (
            <option key={currency} value={currency} className="bg-[#0b0f17]">
              {ACCOUNT_CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>

        <FieldError errors={fieldErrors?.currency} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="openingBalanceDate" className="text-white/70">
          Balance date
        </Label>

        <Input
          id="openingBalanceDate"
          name="openingBalanceDate"
          type="date"
          defaultValue={defaultValues?.openingBalanceDate ?? getLocalDate()}
          aria-invalid={Boolean(fieldErrors?.openingBalanceDate?.length)}
          required
          className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
        />

        <FieldError errors={fieldErrors?.openingBalanceDate} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="openingBalance" className="text-white/70">
          {balanceLabel}
        </Label>

        <Input
          id="openingBalance"
          name="openingBalance"
          type="number"
          step="0.01"
          inputMode="decimal"
          defaultValue={defaultValues?.openingBalance ?? 0}
          aria-invalid={Boolean(fieldErrors?.openingBalance?.length)}
          required
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />

        <p className="text-xs leading-5 text-white/30">{balanceHelp}</p>

        <FieldError errors={fieldErrors?.openingBalance} />
      </div>
    </div>
  );
}

function getLocalDate(): string {
  const now = new Date();

  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 10);
}
