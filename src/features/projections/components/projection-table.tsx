import type { AccountCurrency } from "@/features/accounts/account.types";
import type { ProjectionMonth } from "@/features/projections/projection.types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

interface ProjectionTableProps {
  months: ProjectionMonth[];
  currency: AccountCurrency;
}

export function ProjectionTable({ months, currency }: ProjectionTableProps) {
  return (
    <section
      aria-labelledby="monthly-forecast-heading"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] px-5 py-4">
        <h2 id="monthly-forecast-heading" className="section-title">
          Monthly forecast
        </h2>

        <p className="section-description">
          Projected values are estimates and are not guaranteed future results.
        </p>
      </header>

      {months.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-white/55">
            No forecast months
          </p>

          <p className="mt-1 text-xs leading-5 text-white/30">
            Adjust the projection assumptions to generate a monthly forecast.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {months.map((month) => (
              <ProjectionMonthCard
                key={month.key}
                month={month}
                currency={currency}
              />
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableCaption className="sr-only">
                Monthly financial projection containing opening balance, income,
                expenses, loan payments, net cash flow, and closing balance.
              </TableCaption>

              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col">Month</TableHead>

                  <TableHead scope="col" className="text-right">
                    Opening
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Income
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Expenses
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Loan payments
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Net cash flow
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Closing
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {months.map((month) => (
                  <TableRow key={month.key}>
                    <TableCell className="font-semibold text-white/68">
                      {month.label}
                    </TableCell>

                    <MoneyCell
                      value={month.openingBalance}
                      currency={currency}
                    />

                    <MoneyCell
                      value={month.income}
                      currency={currency}
                      className="text-emerald-300"
                    />

                    <MoneyCell value={month.expenses} currency={currency} />

                    <MoneyCell
                      value={month.loanPayments}
                      currency={currency}
                      className="text-violet-300"
                    />

                    <MoneyCell
                      value={month.netCashFlow}
                      currency={currency}
                      className={
                        month.netCashFlow >= 0
                          ? "text-emerald-300"
                          : "text-red-300"
                      }
                      showPositiveSign
                    />

                    <MoneyCell
                      value={month.closingBalance}
                      currency={currency}
                      className={
                        month.closingBalance < 0
                          ? "text-red-300"
                          : "text-white/78"
                      }
                    />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function ProjectionMonthCard({
  month,
  currency,
}: {
  month: ProjectionMonth;
  currency: AccountCurrency;
}) {
  return (
    <article className="rounded-xl border border-white/[0.07] bg-black/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/30">Forecast month</p>

          <h3 className="mt-1 text-sm font-semibold text-white/72">
            {month.label}
          </h3>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-white/30">Closing balance</p>

          <p
            className={cn(
              "financial-number mt-1 text-sm font-semibold",

              month.closingBalance < 0 ? "text-red-300" : "text-white/78",
            )}
          >
            {formatCurrency(month.closingBalance, currency)}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4 text-xs">
        <MobileMoneyValue
          label="Opening"
          value={month.openingBalance}
          currency={currency}
        />

        <MobileMoneyValue
          label="Income"
          value={month.income}
          currency={currency}
          className="text-emerald-300"
        />

        <MobileMoneyValue
          label="Expenses"
          value={month.expenses}
          currency={currency}
        />

        <MobileMoneyValue
          label="Loan payments"
          value={month.loanPayments}
          currency={currency}
          className="text-violet-300"
        />

        <MobileMoneyValue
          label="Net cash flow"
          value={month.netCashFlow}
          currency={currency}
          showPositiveSign
          className={
            month.netCashFlow >= 0 ? "text-emerald-300" : "text-red-300"
          }
        />

        <MobileMoneyValue
          label="Total outflow"
          value={month.totalOutflow}
          currency={currency}
        />
      </dl>
    </article>
  );
}

function MobileMoneyValue({
  label,
  value,
  currency,
  className,
  showPositiveSign = false,
}: {
  label: string;
  value: number;
  currency: AccountCurrency;
  className?: string;
  showPositiveSign?: boolean;
}) {
  return (
    <div>
      <dt className="text-white/28">{label}</dt>

      <dd
        className={cn(
          "financial-number mt-1 truncate font-semibold text-white/58",
          className,
        )}
      >
        {showPositiveSign && value > 0 ? "+" : ""}

        {formatCurrency(value, currency)}
      </dd>
    </div>
  );
}

function MoneyCell({
  value,
  currency,
  className,
  showPositiveSign = false,
}: {
  value: number;
  currency: AccountCurrency;
  className?: string;
  showPositiveSign?: boolean;
}) {
  return (
    <TableCell
      className={cn(
        "financial-number text-right text-sm text-white/58",
        className,
      )}
    >
      {showPositiveSign && value > 0 ? "+" : ""}

      {formatCurrency(value, currency)}
    </TableCell>
  );
}
