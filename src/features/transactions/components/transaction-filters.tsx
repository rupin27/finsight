import Link from "next/link";
import { Filter, Search, X } from "lucide-react";

import type { Account } from "@/features/accounts/account.types";
import type {
  TransactionCategory,
  TransactionFilters as Filters,
} from "@/features/transactions/transaction.types";
import {
  TRANSACTION_KINDS,
  TRANSACTION_KIND_LABELS,
} from "@/features/transactions/transaction.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
  filters: Filters;
  accounts: Account[];
  categories: TransactionCategory[];
}

const selectClassName =
  "flex h-10 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40";

export function TransactionFilters({
  filters,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const hasFilters = Boolean(
    filters.query ||
    filters.transactionKind ||
    filters.accountId ||
    filters.categoryId ||
    filters.dateFrom ||
    filters.dateTo,
  );

  return (
    <form
      action="/transactions"
      method="get"
      className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(140px,1fr))_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />

          <Input
            name="q"
            defaultValue={filters.query ?? ""}
            placeholder="Search transactions"
            className="pl-9 border-white/10 bg-white/[0.04] text-white placeholder:text-white/25"
          />
        </div>

        <select
          name="kind"
          defaultValue={filters.transactionKind ?? ""}
          className={selectClassName}
        >
          <option value="" className="bg-[#0b0f17]">
            All types
          </option>

          {TRANSACTION_KINDS.map((kind) => (
            <option key={kind} value={kind} className="bg-[#0b0f17]">
              {TRANSACTION_KIND_LABELS[kind]}
            </option>
          ))}
        </select>

        <select
          name="account"
          defaultValue={filters.accountId ?? ""}
          className={selectClassName}
        >
          <option value="" className="bg-[#0b0f17]">
            All accounts
          </option>

          {accounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
              className="bg-[#0b0f17]"
            >
              {account.name}
            </option>
          ))}
        </select>

        <select
          name="category"
          defaultValue={filters.categoryId ?? ""}
          className={selectClassName}
        >
          <option value="" className="bg-[#0b0f17]">
            All categories
          </option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
              className="bg-[#0b0f17]"
            >
              {category.name}
            </option>
          ))}
        </select>

        <Input
          name="from"
          type="date"
          defaultValue={filters.dateFrom ?? ""}
          aria-label="From date"
          className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
        />

        <Input
          name="to"
          type="date"
          defaultValue={filters.dateTo ?? ""}
          aria-label="To date"
          className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
        />

        <div className="flex gap-2">
          <Button type="submit">
            <Filter className="size-4" />
            Apply
          </Button>

          {hasFilters && (
            <Link
              href="/transactions"
              aria-label="Clear filters"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "icon",
                }),
                "border-white/10 bg-transparent text-white/45 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <X className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
