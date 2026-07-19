"use client";

import { useEffect, useMemo, useState } from "react";

import type { Account } from "@/features/accounts/account.types";
import type {
  TransactionCategory,
  TransactionKind,
  TransactionRecord,
} from "@/features/transactions/transaction.types";
import {
  TRANSACTION_KINDS,
  TRANSACTION_KIND_LABELS,
} from "@/features/transactions/transaction.types";
import type { TransactionFieldErrors } from "@/features/transactions/transaction-validation";
import { RecurrenceFields } from "@/features/transactions/components/recurrence-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TransactionFormFieldsProps {
  accounts: Account[];
  categories: TransactionCategory[];
  defaultValues?: Partial<TransactionRecord>;
  fieldErrors?: TransactionFieldErrors;
}

interface FieldErrorProps {
  errors?: string[];
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50";

function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-red-300">{errors[0]}</p>;
}

export function TransactionFormFields({
  accounts,
  categories,
  defaultValues,
  fieldErrors,
}: TransactionFormFieldsProps) {
  const sourceAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.accountType !== "loan" &&
          (account.isActive || account.id === defaultValues?.accountId),
      ),
    [accounts, defaultValues?.accountId],
  );

  const loanAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.accountType === "loan" &&
          (account.isActive ||
            account.id === defaultValues?.destinationAccountId),
      ),
    [accounts, defaultValues?.destinationAccountId],
  );

  const initialKind = defaultValues?.transactionKind ?? "expense";

  const initialAccountId =
    defaultValues?.accountId ?? sourceAccounts[0]?.id ?? "";

  const [transactionKind, setTransactionKind] =
    useState<TransactionKind>(initialKind);

  const [accountId, setAccountId] = useState(initialAccountId);

  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "");

  const [destinationAccountId, setDestinationAccountId] = useState(
    defaultValues?.destinationAccountId ?? "",
  );

  const sourceAccount =
    sourceAccounts.find((account) => account.id === accountId) ??
    sourceAccounts[0];

  const expectedCategoryKind =
    transactionKind === "income" ? "income" : "expense";

  const availableCategories = categories.filter(
    (category) => category.kind === expectedCategoryKind,
  );

  const availableLoans = loanAccounts.filter(
    (account) => !sourceAccount || account.currency === sourceAccount.currency,
  );

  useEffect(() => {
    const categoryIsAvailable = availableCategories.some(
      (category) => category.id === categoryId,
    );

    if (!categoryIsAvailable) {
      const preferredCategory =
        transactionKind === "loan_payment"
          ? availableCategories.find(
              (category) => category.name === "Loan Payment",
            )
          : undefined;

      setCategoryId(preferredCategory?.id ?? availableCategories[0]?.id ?? "");
    }
  }, [availableCategories, categoryId, transactionKind]);

  useEffect(() => {
    if (transactionKind !== "loan_payment") {
      setDestinationAccountId("");
      return;
    }

    const destinationIsAvailable = availableLoans.some(
      (account) => account.id === destinationAccountId,
    );

    if (!destinationIsAvailable) {
      setDestinationAccountId(availableLoans[0]?.id ?? "");
    }
  }, [availableLoans, destinationAccountId, transactionKind]);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="transactionKind" className="text-white/70">
          Transaction type
        </Label>

        <select
          id="transactionKind"
          name="transactionKind"
          value={transactionKind}
          onChange={(event) => {
            setTransactionKind(event.target.value as TransactionKind);
          }}
          className={selectClassName}
        >
          {TRANSACTION_KINDS.map((kind) => (
            <option
              key={kind}
              value={kind}
              disabled={kind === "loan_payment" && loanAccounts.length === 0}
              className="bg-[#0b0f17]"
            >
              {TRANSACTION_KIND_LABELS[kind]}
            </option>
          ))}
        </select>

        <FieldError errors={fieldErrors?.transactionKind} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transactionDate" className="text-white/70">
          Date
        </Label>

        <Input
          id="transactionDate"
          name="transactionDate"
          type="date"
          max={getLocalDate()}
          defaultValue={defaultValues?.transactionDate ?? getLocalDate()}
          required
          className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
        />

        <FieldError errors={fieldErrors?.transactionDate} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="accountId" className="text-white/70">
          {transactionKind === "loan_payment" ? "Paid from" : "Account"}
        </Label>

        <select
          id="accountId"
          name="accountId"
          value={accountId}
          onChange={(event) => {
            setAccountId(event.target.value);
          }}
          required
          className={selectClassName}
        >
          {sourceAccounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
              className="bg-[#0b0f17]"
            >
              {account.name} · {account.currency}
              {!account.isActive ? " · Inactive" : ""}
            </option>
          ))}
        </select>

        <FieldError errors={fieldErrors?.accountId} />
      </div>

      {transactionKind === "loan_payment" && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="destinationAccountId" className="text-white/70">
            Loan being paid
          </Label>

          <select
            id="destinationAccountId"
            name="destinationAccountId"
            value={destinationAccountId}
            onChange={(event) => {
              setDestinationAccountId(event.target.value);
            }}
            required
            className={selectClassName}
          >
            {availableLoans.length === 0 ? (
              <option value="" className="bg-[#0b0f17]">
                No matching loan account
              </option>
            ) : (
              availableLoans.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                  className="bg-[#0b0f17]"
                >
                  {account.name} · {account.currency}
                </option>
              ))
            )}
          </select>

          <p className="text-xs leading-5 text-white/30">
            This will reduce both the payment account and the selected loan
            balance.
          </p>

          <FieldError errors={fieldErrors?.destinationAccountId} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-white/70">
          Amount
          {sourceAccount ? ` (${sourceAccount.currency})` : ""}
        </Label>

        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          defaultValue={defaultValues?.amount ?? ""}
          placeholder="0.00"
          required
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />

        <FieldError errors={fieldErrors?.amount} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId" className="text-white/70">
          Category
        </Label>

        <select
          id="categoryId"
          name="categoryId"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
          }}
          required
          className={selectClassName}
        >
          {availableCategories.map((category) => (
            <option
              key={category.id}
              value={category.id}
              className="bg-[#0b0f17]"
            >
              {category.name}
            </option>
          ))}
        </select>

        <FieldError errors={fieldErrors?.categoryId} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description" className="text-white/70">
          Description
        </Label>

        <Input
          id="description"
          name="description"
          type="text"
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Example: Monthly salary or grocery shopping"
          required
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />

        <FieldError errors={fieldErrors?.description} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="merchant" className="text-white/70">
          Merchant or payer
        </Label>

        <Input
          id="merchant"
          name="merchant"
          type="text"
          defaultValue={defaultValues?.merchant ?? ""}
          placeholder="Optional"
          className="border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />

        <FieldError errors={fieldErrors?.merchant} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes" className="text-white/70">
          Notes
        </Label>

        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Optional notes about this transaction"
          className="min-h-24 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
        />

        <FieldError errors={fieldErrors?.notes} />
      </div>

      <RecurrenceFields
        defaultValues={defaultValues}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}

function getLocalDate(): string {
  const now = new Date();

  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}
