import type { AccountCurrency } from "@/features/accounts/account.types";
import type { AmortizationScenario } from "@/features/loans/loan.types";
import {
  Table,
  TableBody,
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
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] px-5 py-4">
        <h2 className="font-medium text-white">
          Accelerated amortization schedule
        </h2>

        <p className="mt-1 text-xs text-white/30">
          Showing the first 24 future payments.
        </p>
      </header>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.07] hover:bg-transparent">
              <TableHead className="text-white/35">Payment</TableHead>

              <TableHead className="text-white/35">Date</TableHead>

              <TableHead className="text-right text-white/35">
                Opening
              </TableHead>

              <TableHead className="text-right text-white/35">
                Interest
              </TableHead>

              <TableHead className="text-right text-white/35">
                Principal
              </TableHead>

              <TableHead className="text-right text-white/35">Extra</TableHead>

              <TableHead className="text-right text-white/35">
                Payment
              </TableHead>

              <TableHead className="text-right text-white/35">
                Closing
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleRows.map((row) => {
              const extraPayment =
                row.additionalMonthlyPayment + row.oneTimePayment;

              return (
                <TableRow
                  key={row.period}
                  className="border-white/[0.055] hover:bg-white/[0.025]"
                >
                  <TableCell className="text-white/35">{row.period}</TableCell>

                  <TableCell className="whitespace-nowrap text-white/45">
                    {formatDate(row.paymentDate)}
                  </TableCell>

                  <MoneyCell value={row.openingBalance} currency={currency} />

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
                    className="text-white/75"
                  />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {scenario.schedule.length > 24 && (
        <div className="border-t border-white/[0.06] px-5 py-4 text-xs text-white/30">
          {scenario.schedule.length - 24} additional future payments are not
          shown in this preview.
        </div>
      )}
    </section>
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
        "whitespace-nowrap text-right text-sm text-white/55",
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
