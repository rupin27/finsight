import {
  Banknote,
  Landmark,
  PiggyBank,
  Power,
  PowerOff,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { toggleAccountActive } from "@/app/(dashboard)/accounts/actions";
import {
  ACCOUNT_COUNTRY_LABELS,
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
} from "@/features/accounts/account.types";
import { DeleteAccountDialog } from "@/features/accounts/components/delete-account-dialog";
import { EditAccountDialog } from "@/features/accounts/components/edit-account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: Account;
}

const ACCOUNT_ICONS: Record<AccountType, LucideIcon> = {
  checking: WalletCards,
  savings: PiggyBank,
  cash: Banknote,
  loan: Landmark,
};

export function AccountCard({ account }: AccountCardProps) {
  const Icon = ACCOUNT_ICONS[account.accountType];

  const toggleAction = toggleAccountActive.bind(
    null,
    account.id,
    !account.isActive,
  );

  const balanceLabel =
    account.accountType === "loan" ? "Outstanding balance" : "Current balance";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-white/[0.12]",
        !account.isActive && "opacity-55",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl",
              account.accountType === "loan"
                ? "bg-violet-400/10 text-violet-300"
                : "bg-cyan-400/10 text-cyan-300",
            )}
          >
            <Icon className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate font-medium text-white">{account.name}</h2>

            <p className="mt-1 truncate text-xs text-white/35">
              {account.institution ?? ACCOUNT_TYPE_LABELS[account.accountType]}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            account.isActive
              ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
              : "border-white/10 bg-white/[0.03] text-white/35",
          )}
        >
          {account.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="mt-7">
        <p className="text-xs text-white/30">{balanceLabel}</p>

        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight",
            account.accountType === "loan" ? "text-violet-200" : "text-white",
          )}
        >
          {formatCurrency(account.currentBalance, account.currency)}
        </p>
        <p className="mt-2 text-xs text-white/30">
          {account.transactionCount}{" "}
          {account.transactionCount === 1 ? "transaction" : "transactions"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/25">
            Location
          </p>

          <p className="mt-1 text-sm text-white/55">
            {ACCOUNT_COUNTRY_LABELS[account.country]}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/25">
            Balance date
          </p>

          <p className="mt-1 text-sm text-white/55">
            {formatAccountDate(account.openingBalanceDate)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-white/[0.06] pt-4">
        <EditAccountDialog account={account} />

        <form action={toggleAction}>
          <Button
            type="submit"
            variant="ghost"
            className="h-9 px-3 text-white/45 hover:bg-white/[0.06] hover:text-white"
          >
            {account.isActive ? (
              <PowerOff className="size-3.5" />
            ) : (
              <Power className="size-3.5" />
            )}

            {account.isActive ? "Deactivate" : "Reactivate"}
          </Button>
        </form>

        <DeleteAccountDialog
          accountId={account.id}
          accountName={account.name}
        />
      </div>
    </article>
  );
}

function formatAccountDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
