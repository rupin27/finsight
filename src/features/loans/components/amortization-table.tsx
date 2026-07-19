import type { AccountCurrency } from "@/features/accounts/account.types";
import type {
  AmortizationRow,
  AmortizationScenario,
} from "@/features/loans/loan.types";
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

interface AmortizationTableProps {
  scenario: AmortizationScenario;

  currency: AccountCurrency;
}

export function AmortizationTable({
  scenario,
  currency,
}: AmortizationTableProps) {
  const visibleRows = scenario.schedule.slice(0, 24);

  return (
    <section
      aria-labelledby="amortization-heading"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] px-5 py-4">
        <h2 id="amortization-heading" className="section-title">
          Accelerated amortization schedule
        </h2>

        <p className="section-description">
          Showing the first 24 future payments in the accelerated scenario.
        </p>
      </header>

      {visibleRows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-white/55">
            No future payments
          </p>

          <p className="mt-1 text-xs leading-5 text-white/30">
            The loan is already paid off or has no generated repayment schedule.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-4 md:hidden">
            {visibleRows.map((row) => (
              <AmortizationCard
                key={row.period}
                row={row}
                currency={currency}
              />
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableCaption className="sr-only">
                Accelerated loan amortization schedule containing payment
                number, date, opening balance, interest, principal, extra
                payments, total payment, and closing balance.
              </TableCaption>

              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col">Payment</TableHead>

                  <TableHead scope="col">Date</TableHead>

                  <TableHead scope="col" className="text-right">
                    Opening
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Interest
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Principal
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Extra
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Payment
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Closing
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleRows.map((row) => {
                  const extraPayment =
                    row.additionalMonthlyPayment + row.oneTimePayment;

                  return (
                    <TableRow key={row.period}>
                      <TableCell className="financial-number text-white/38">
                        {row.period}
                      </TableCell>

                      <TableCell className="text-white/48">
                        {formatDate(row.paymentDate)}
                      </TableCell>

                      <MoneyCell
                        value={row.openingBalance}
                        currency={currency}
                      />

                      <MoneyCell
                        value={row.interest}
                        currency={currency}
                        className="text-amber-300"
                      />

                      <MoneyCell
                        value={row.principalPaid}
                        currency={currency}
                        className={
                          row.principalPaid >= 0
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      />

                      <MoneyCell
                        value={extraPayment}
                        currency={currency}
                        className="text-cyan-300"
                      />

                      <MoneyCell value={row.totalPayment} currency={currency} />

                      <MoneyCell
                        value={row.closingBalance}
                        currency={currency}
                        className="text-white/78"
                      />
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {scenario.schedule.length > 24 && (
        <div className="border-t border-white/[0.06] px-5 py-4 text-xs leading-5 text-white/32">
          {scenario.schedule.length - 24} additional future payments are not
          shown in this preview.
        </div>
      )}
    </section>
  );
}

function AmortizationCard({
  row,
  currency,
}: {
  row: AmortizationRow;
  currency: AccountCurrency;
}) {
  const extraPayment = row.additionalMonthlyPayment + row.oneTimePayment;

  return (
    <article className="rounded-xl border border-white/[0.07] bg-black/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/30">Payment</p>

          <p className="financial-number mt-1 text-sm font-semibold text-white/70">
            #{row.period}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-white/30">Date</p>

          <p className="mt-1 text-sm font-semibold text-white/65">
            {formatDate(row.paymentDate)}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4 text-xs">
        <MobileMoneyValue
          label="Opening"
          value={row.openingBalance}
          currency={currency}
        />

        <MobileMoneyValue
          label="Closing"
          value={row.closingBalance}
          currency={currency}
          className="text-white/75"
        />

        <MobileMoneyValue
          label="Interest"
          value={row.interest}
          currency={currency}
          className="text-amber-300"
        />

        <MobileMoneyValue
          label="Principal"
          value={row.principalPaid}
          currency={currency}
          className={
            row.principalPaid >= 0 ? "text-emerald-300" : "text-red-300"
          }
        />

        <MobileMoneyValue
          label="Extra"
          value={extraPayment}
          currency={currency}
          className="text-cyan-300"
        />

        <MobileMoneyValue
          label="Total payment"
          value={row.totalPayment}
          currency={currency}
          className="text-white/75"
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
}: {
  label: string;
  value: number;
  currency: AccountCurrency;
  className?: string;
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
        {formatCurrency(value, currency)}
      </dd>
    </div>
  );
}

function MoneyCell({
  value,
  currency,
  className,
}: {
  value: number;
  currency: AccountCurrency;
  className?: string;
}) {
  return (
    <TableCell
      className={cn(
        "financial-number text-right text-sm text-white/58",
        className,
      )}
    >
      {formatCurrency(value, currency)}
    </TableCell>
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
