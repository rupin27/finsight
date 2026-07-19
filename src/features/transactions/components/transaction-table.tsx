import { ArrowDownLeft, ArrowUpRight, Landmark, Repeat2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Account } from "@/features/accounts/account.types";
import { DeleteTransactionDialog } from "@/features/transactions/components/delete-transaction-dialog";
import { EditTransactionDialog } from "@/features/transactions/components/edit-transaction-dialog";
import type {
  TransactionCategory,
  TransactionRecord,
} from "@/features/transactions/transaction.types";
import { TRANSACTION_KIND_LABELS } from "@/features/transactions/transaction.types";
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
    <>
      <div className="space-y-3 md:hidden">
        {transactions.map((transaction) => {
          const view = getTransactionView({
            transaction,
            accountMap,
            categoryMap,
          });

          return (
            <MobileTransactionCard
              key={transaction.id}
              transaction={transaction}
              view={view}
              accounts={accounts}
              categories={categories}
            />
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)] md:block">
        <Table>
          <TableCaption className="sr-only">
            Financial transactions, including date, account, category, type,
            amount, and available actions.
          </TableCaption>

          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col">Date</TableHead>

              <TableHead scope="col">Transaction</TableHead>

              <TableHead scope="col">Account</TableHead>

              <TableHead scope="col">Category</TableHead>

              <TableHead scope="col">Type</TableHead>

              <TableHead scope="col" className="text-right">
                Amount
              </TableHead>

              <TableHead scope="col" className="w-24 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.map((transaction) => {
              const view = getTransactionView({
                transaction,
                accountMap,
                categoryMap,
              });

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-sm text-white/42">
                    {view.date}
                  </TableCell>

                  <TableCell>
                    <TransactionIdentity
                      transaction={transaction}
                      view={view}
                    />
                  </TableCell>

                  <TableCell className="text-sm text-white/48">
                    {view.isLoanPayment && view.destinationAccount ? (
                      <div>
                        <p>{view.sourceAccount?.name ?? "Unknown"}</p>

                        <p className="mt-1 text-xs text-white/28">
                          To {view.destinationAccount.name}
                        </p>
                      </div>
                    ) : (
                      (view.sourceAccount?.name ?? "Unknown account")
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-white/48">
                    {view.categoryName}
                  </TableCell>

                  <TableCell>
                    <TransactionTypeBadge view={view} />
                  </TableCell>

                  <TableCell
                    className={cn(
                      "financial-number text-right font-semibold",

                      view.isIncome ? "text-emerald-300" : "text-white/78",
                    )}
                  >
                    {view.amount}
                  </TableCell>

                  <TableCell>
                    <TransactionActions
                      transaction={transaction}
                      accounts={accounts}
                      categories={categories}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function MobileTransactionCard({
  transaction,
  view,
  accounts,
  categories,
}: {
  transaction: TransactionRecord;

  view: TransactionView;

  accounts: Account[];

  categories: TransactionCategory[];
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.1)]">
      <div className="flex items-start gap-3">
        <TransactionIcon view={view} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white/80">
            {transaction.description}
          </p>

          <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-white/35">
            <span>{view.date}</span>

            {transaction.merchant && (
              <>
                <span aria-hidden="true" className="text-white/18">
                  •
                </span>

                <span className="truncate">{transaction.merchant}</span>
              </>
            )}

            {transaction.isRecurring && (
              <>
                <Repeat2
                  aria-hidden="true"
                  className="size-3 shrink-0 text-cyan-300/75"
                />

                <span className="sr-only">Recurring transaction</span>
              </>
            )}
          </div>
        </div>

        <p
          className={cn(
            "financial-number shrink-0 text-sm font-semibold",

            view.isIncome ? "text-emerald-300" : "text-white/82",
          )}
        >
          {view.amount}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/[0.06] pt-4 text-xs">
        <div>
          <dt className="text-white/28">Account</dt>

          <dd className="mt-1 truncate text-white/58">
            {view.sourceAccount?.name ?? "Unknown account"}
          </dd>

          {view.isLoanPayment && view.destinationAccount && (
            <dd className="mt-0.5 truncate text-white/28">
              To {view.destinationAccount.name}
            </dd>
          )}
        </div>

        <div>
          <dt className="text-white/28">Category</dt>

          <dd className="mt-1 truncate text-white/58">{view.categoryName}</dd>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-4">
          <div>
            <dt className="sr-only">Transaction type</dt>

            <dd>
              <TransactionTypeBadge view={view} />
            </dd>
          </div>

          <dd>
            <TransactionActions
              transaction={transaction}
              accounts={accounts}
              categories={categories}
            />
          </dd>
        </div>
      </dl>
    </article>
  );
}

function TransactionIdentity({
  transaction,
  view,
}: {
  transaction: TransactionRecord;

  view: TransactionView;
}) {
  return (
    <div className="flex items-start gap-3">
      <TransactionIcon view={view} />

      <div className="min-w-0">
        <p
          title={transaction.description}
          className="max-w-64 truncate text-sm font-semibold text-white/78"
        >
          {transaction.description}
        </p>

        <div className="mt-1 flex items-center gap-2">
          {transaction.merchant && (
            <span
              title={transaction.merchant}
              className="max-w-48 truncate text-xs text-white/32"
            >
              {transaction.merchant}
            </span>
          )}

          {transaction.isRecurring && (
            <>
              <Repeat2 aria-hidden="true" className="size-3 text-cyan-300/75" />

              <span className="sr-only">Recurring transaction</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionIcon({ view }: { view: TransactionView }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        [
          "flex size-10 shrink-0",
          "items-center justify-center",
          "rounded-xl border",
        ].join(" "),

        view.isIncome
          ? "border-emerald-400/10 bg-emerald-400/10 text-emerald-300"
          : view.isLoanPayment
            ? "border-violet-400/10 bg-violet-400/10 text-violet-300"
            : "border-amber-400/10 bg-amber-400/10 text-amber-300",
      )}
    >
      {view.isIncome ? (
        <ArrowDownLeft className="size-4" />
      ) : view.isLoanPayment ? (
        <Landmark className="size-4" />
      ) : (
        <ArrowUpRight className="size-4" />
      )}
    </div>
  );
}

function TransactionTypeBadge({ view }: { view: TransactionView }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap",

        view.isIncome
          ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"
          : view.isLoanPayment
            ? "border-violet-400/20 bg-violet-400/[0.06] text-violet-200"
            : "border-amber-400/20 bg-amber-400/[0.06] text-amber-200",
      )}
    >
      {view.typeLabel}
    </Badge>
  );
}

function TransactionActions({
  transaction,
  accounts,
  categories,
}: {
  transaction: TransactionRecord;

  accounts: Account[];

  categories: TransactionCategory[];
}) {
  return (
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
  );
}

interface TransactionView {
  date: string;

  sourceAccount: Account | undefined;

  destinationAccount: Account | undefined;

  categoryName: string;
  isIncome: boolean;
  isLoanPayment: boolean;
  amount: string;
  typeLabel: string;
}

function getTransactionView({
  transaction,
  accountMap,
  categoryMap,
}: {
  transaction: TransactionRecord;

  accountMap: Map<string, Account>;

  categoryMap: Map<string, TransactionCategory>;
}): TransactionView {
  const sourceAccount = accountMap.get(transaction.accountId);

  const destinationAccount = transaction.destinationAccountId
    ? accountMap.get(transaction.destinationAccountId)
    : undefined;

  const category = transaction.categoryId
    ? categoryMap.get(transaction.categoryId)
    : undefined;

  const isIncome = transaction.transactionKind === "income";

  const isLoanPayment = transaction.transactionKind === "loan_payment";

  return {
    date: formatTransactionDate(transaction.transactionDate),

    sourceAccount,
    destinationAccount,

    categoryName: category?.name ?? "Uncategorized",

    isIncome,
    isLoanPayment,

    amount: `${isIncome ? "+" : "−"}${formatCurrency(
      transaction.amount,
      transaction.currency,
    )}`,

    typeLabel: TRANSACTION_KIND_LABELS[transaction.transactionKind],
  };
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
