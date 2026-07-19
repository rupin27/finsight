import type { AccountCurrency } from "@/features/accounts/account.types";
import type { ProjectionMonth } from "@/features/projections/projection.types";
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

interface ProjectionTableProps {
  months: ProjectionMonth[];
  currency: AccountCurrency;
}

export function ProjectionTable({ months, currency }: ProjectionTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] px-5 py-4">
        <h2 className="font-medium text-white">Monthly forecast</h2>

        <p className="mt-1 text-xs text-white/30">
          Projected values are estimates, not guaranteed future results.
        </p>
      </header>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.07] hover:bg-transparent">
              <TableHead className="text-white/35">Month</TableHead>

              <TableHead className="text-right text-white/35">
                Opening
              </TableHead>

              <TableHead className="text-right text-white/35">Income</TableHead>

              <TableHead className="text-right text-white/35">
                Expenses
              </TableHead>

              <TableHead className="text-right text-white/35">
                Loan payments
              </TableHead>

              <TableHead className="text-right text-white/35">
                Net cash flow
              </TableHead>

              <TableHead className="text-right text-white/35">
                Closing
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {months.map((month) => (
              <TableRow
                key={month.key}
                className="border-white/[0.055] hover:bg-white/[0.025]"
              >
                <TableCell className="font-medium text-white/65">
                  {month.label}
                </TableCell>

                <MoneyCell value={month.openingBalance} currency={currency} />

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
                    month.netCashFlow >= 0 ? "text-emerald-300" : "text-red-300"
                  }
                  showSign
                />

                <MoneyCell
                  value={month.closingBalance}
                  currency={currency}
                  className={
                    month.closingBalance < 0 ? "text-red-300" : "text-white/75"
                  }
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function MoneyCell({
  value,
  currency,
  className,
  showSign = false,
}: {
  value: number;
  currency: AccountCurrency;
  className?: string;
  showSign?: boolean;
}) {
  return (
    <TableCell
      className={cn(
        "whitespace-nowrap text-right text-sm text-white/55",
        className,
      )}
    >
      {showSign && value > 0 ? "+" : ""}
      {formatCurrency(value, currency)}
    </TableCell>
  );
}
