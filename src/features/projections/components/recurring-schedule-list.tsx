import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Landmark, Repeat2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
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
    <section
      aria-labelledby="recurring-schedules-heading"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-2">
          <Repeat2 aria-hidden="true" className="size-4 text-cyan-300" />

          <h2 id="recurring-schedules-heading" className="section-title">
            Recurring schedules
          </h2>
        </div>

        <p className="section-description">
          These transactions currently power your forecast.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
            <Repeat2 aria-hidden="true" className="size-5" />
          </div>

          <p className="mt-4 text-sm font-semibold text-white/58">
            No recurring transactions yet
          </p>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/30">
            Edit a salary, rent, subscription, or loan payment and enable its
            recurring schedule.
          </p>

          <Link
            href="/transactions"
            className={cn(
              buttonVariants({
                variant: "outline",

                size: "sm",
              }),

              "mt-5 border-white/10 bg-transparent text-white/60 hover:bg-white/[0.06]",
            )}
          >
            Manage transactions
          </Link>
        </div>
      ) : (
        <div role="list" className="divide-y divide-white/[0.055]">
          {items.map((item) => {
            const isIncome = item.transactionKind === "income";

            const isLoanPayment = item.transactionKind === "loan_payment";

            const Icon = isIncome
              ? ArrowDownLeft
              : isLoanPayment
                ? Landmark
                : ArrowUpRight;

            const typeLabel = isIncome
              ? "Income"
              : isLoanPayment
                ? "Loan payment"
                : "Expense";

            const signedAmount = `${isIncome ? "+" : "−"}${formatCurrency(
              item.amountInDisplayCurrency,
              displayCurrency,
            )}`;

            return (
              <article
                key={item.id}
                role="listitem"
                aria-label={`${item.description}, ${typeLabel}, ${signedAmount}, ${
                  RECURRENCE_FREQUENCY_LABELS[item.recurrenceFrequency]
                }`}
                className="px-5 py-4 transition-colors hover:bg-white/[0.018]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      aria-hidden="true"
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl border",

                        isIncome
                          ? "border-emerald-400/10 bg-emerald-400/10 text-emerald-300"
                          : isLoanPayment
                            ? "border-violet-400/10 bg-violet-400/10 text-violet-300"
                            : "border-amber-400/10 bg-amber-400/10 text-amber-300",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <p
                        title={item.description}
                        className="truncate text-sm font-semibold text-white/72"
                      >
                        {item.description}
                      </p>

                      <p className="mt-1 truncate text-xs text-white/32">
                        {item.accountName}
                        {" · "}
                        {item.categoryName}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/28">
                        {RECURRENCE_FREQUENCY_LABELS[item.recurrenceFrequency]}

                        {" · Starts "}

                        <time dateTime={item.recurrenceStartDate}>
                          {formatDate(item.recurrenceStartDate)}
                        </time>

                        {item.recurrenceEndDate && (
                          <>
                            {" · Ends "}

                            <time dateTime={item.recurrenceEndDate}>
                              {formatDate(item.recurrenceEndDate)}
                            </time>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p
                      className={cn(
                        "financial-number text-sm font-semibold",

                        isIncome ? "text-emerald-300" : "text-white/70",
                      )}
                    >
                      {signedAmount}
                    </p>

                    {item.currency !== displayCurrency && (
                      <p className="financial-number mt-1 text-xs text-white/28">
                        Native:{" "}
                        {formatCurrency(item.nativeAmount, item.currency)}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-white/25">{typeLabel}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
