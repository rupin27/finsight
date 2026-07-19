import { ArrowDownLeft, ArrowUpRight, Landmark, Repeat2 } from "lucide-react";

import type { AccountCurrency } from "@/features/accounts/account.types";
import type { RecurringProjectionItem } from "@/features/projections/projection.types";
import { RECURRENCE_FREQUENCY_LABELS } from "@/features/transactions/transaction.types";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface RecurringScheduleListProps {
  items: RecurringProjectionItem[];
  displayCurrency: AccountCurrency;
}

export function RecurringScheduleList({
  items,
  displayCurrency,
}: RecurringScheduleListProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-2">
          <Repeat2 className="size-4 text-cyan-300" />

          <h2 className="font-medium text-white">Recurring schedules</h2>
        </div>

        <p className="mt-1 text-xs text-white/30">
          These transactions currently power your forecast.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-white/45">
            No recurring transactions yet.
          </p>

          <p className="mt-2 text-xs text-white/25">
            Edit a salary, rent, subscription, or loan payment and enable its
            recurring schedule.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.055]">
          {items.map((item) => {
            const isIncome = item.transactionKind === "income";

            const isLoanPayment = item.transactionKind === "loan_payment";

            const Icon = isIncome
              ? ArrowDownLeft
              : isLoanPayment
                ? Landmark
                : ArrowUpRight;

            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      isIncome
                        ? "bg-emerald-400/10 text-emerald-300"
                        : isLoanPayment
                          ? "bg-violet-400/10 text-violet-300"
                          : "bg-amber-400/10 text-amber-300",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/70">
                      {item.description}
                    </p>

                    <p className="mt-1 truncate text-xs text-white/30">
                      {item.accountName}
                      {" · "}
                      {item.categoryName}
                      {" · "}
                      {RECURRENCE_FREQUENCY_LABELS[item.recurrenceFrequency]}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isIncome ? "text-emerald-300" : "text-white/65",
                    )}
                  >
                    {isIncome ? "+" : "−"}
                    {formatCurrency(
                      item.amountInDisplayCurrency,
                      displayCurrency,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-white/25">
                    Native: {formatCurrency(item.nativeAmount, item.currency)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
