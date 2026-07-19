import { ArrowDownLeft, ArrowUpRight, Landmark, Repeat2 } from "lucide-react";

import type { Account } from "@/features/accounts/account.types";
import type {
  TransactionCategory,
  TransactionRecord,
} from "@/features/transactions/transaction.types";
import { TRANSACTION_KIND_LABELS } from "@/features/transactions/transaction.types";
import { DeleteTransactionDialog } from "@/features/transactions/components/delete-transaction-dialog";
import { EditTransactionDialog } from "@/features/transactions/components/edit-transaction-dialog";
import { Badge } from "@/components/ui/badge";
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

interface TransactionTableProps {
  transactions: TransactionRecord[];
  accounts: Account[];
  categories: TransactionCategory[];
}

export function TransactionTable({
  transactions,
  accounts,
  categories,
}: TransactionTableProps) {
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.07] hover:bg-transparent">
            <TableHead className="text-white/35">Date</TableHead>

            <TableHead className="text-white/35">Transaction</TableHead>

            <TableHead className="text-white/35">Account</TableHead>

            <TableHead className="text-white/35">Category</TableHead>

            <TableHead className="text-white/35">Type</TableHead>

            <TableHead className="text-right text-white/35">Amount</TableHead>

            <TableHead className="w-24 text-right text-white/35">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {transactions.map((transaction) => {
            const sourceAccount = accountMap.get(transaction.accountId);

            const destinationAccount = transaction.destinationAccountId
              ? accountMap.get(transaction.destinationAccountId)
              : undefined;

            const category = transaction.categoryId
              ? categoryMap.get(transaction.categoryId)
              : undefined;

            const isIncome = transaction.transactionKind === "income";

            const isLoanPayment =
              transaction.transactionKind === "loan_payment";

            return (
              <TableRow
                key={transaction.id}
                className="border-white/[0.055] hover:bg-white/[0.025]"
              >
                <TableCell className="whitespace-nowrap text-sm text-white/40">
                  {formatTransactionDate(transaction.transactionDate)}
                </TableCell>

                <TableCell>
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                        isIncome
                          ? "bg-emerald-400/10 text-emerald-300"
                          : isLoanPayment
                            ? "bg-violet-400/10 text-violet-300"
                            : "bg-amber-400/10 text-amber-300",
                      )}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="size-4" />
                      ) : isLoanPayment ? (
                        <Landmark className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-64 truncate text-sm font-medium text-white/75">
                        {transaction.description}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        {transaction.merchant && (
                          <span className="max-w-48 truncate text-xs text-white/30">
                            {transaction.merchant}
                          </span>
                        )}

                        {transaction.isRecurring && (
                          <Repeat2 className="size-3 text-cyan-300/70" />
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-sm text-white/45">
                  {isLoanPayment && destinationAccount ? (
                    <div>
                      <p>{sourceAccount?.name ?? "Unknown"}</p>

                      <p className="mt-1 text-xs text-white/25">
                        To {destinationAccount.name}
                      </p>
                    </div>
                  ) : (
                    (sourceAccount?.name ?? "Unknown account")
                  )}
                </TableCell>

                <TableCell className="text-sm text-white/45">
                  {category?.name ?? "Uncategorized"}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      isIncome
                        ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
                        : isLoanPayment
                          ? "border-violet-400/20 bg-violet-400/[0.06] text-violet-200"
                          : "border-amber-400/20 bg-amber-400/[0.06] text-amber-200",
                    )}
                  >
                    {TRANSACTION_KIND_LABELS[transaction.transactionKind]}
                  </Badge>
                </TableCell>

                <TableCell
                  className={cn(
                    "whitespace-nowrap text-right font-medium",
                    isIncome ? "text-emerald-300" : "text-white/75",
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </TableCell>

                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EditTransactionDialog
                      transaction={transaction}
                      accounts={accounts}
                      categories={categories}
                    />

                    <DeleteTransactionDialog
                      transactionId={transaction.id}
                      description={transaction.description}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function formatTransactionDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
