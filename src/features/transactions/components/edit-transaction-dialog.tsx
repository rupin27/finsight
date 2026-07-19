"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateTransaction } from "@/app/(dashboard)/transactions/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Account } from "@/features/accounts/account.types";
import { TransactionFormFields } from "@/features/transactions/components/transaction-form-fields";
import { TransactionSubmitButton } from "@/features/transactions/components/transaction-submit-button";
import {
  INITIAL_TRANSACTION_ACTION_STATE,
  type TransactionActionState,
} from "@/features/transactions/transaction-action-state";
import type {
  TransactionCategory,
  TransactionRecord,
} from "@/features/transactions/transaction.types";

interface EditTransactionDialogProps {
  transaction: TransactionRecord;

  accounts: Account[];

  categories: TransactionCategory[];
}

export function EditTransactionDialog({
  transaction,
  accounts,
  categories,
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${transaction.description}`}
            className="text-white/40 hover:bg-white/[0.06] hover:text-white"
          />
        }
      >
        <Pencil className="size-3.5" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>

          <DialogDescription>
            Update the transaction details. Account balances will be
            recalculated automatically.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EditTransactionForm
            transaction={transaction}
            accounts={accounts}
            categories={categories}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EditTransactionFormProps {
  transaction: TransactionRecord;

  accounts: Account[];

  categories: TransactionCategory[];

  onSuccess: () => void;
}

function EditTransactionForm({
  transaction,
  accounts,
  categories,
  onSuccess,
}: EditTransactionFormProps) {
  const router = useRouter();

  const action = updateTransaction.bind(null, transaction.id);

  const [state, formAction] = useActionState<TransactionActionState, FormData>(
    action,
    INITIAL_TRANSACTION_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Transaction updated");

      onSuccess();
      router.refresh();
    }
  }, [onSuccess, router, state.status]);

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col"
      aria-describedby={state.message ? "edit-transaction-status" : undefined}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <FormStatusMessage
          id="edit-transaction-status"
          status={state.status}
          message={state.message}
        />

        <TransactionFormFields
          accounts={accounts}
          categories={categories}
          defaultValues={transaction}
          fieldErrors={state.fieldErrors}
        />
      </div>

      <DialogFooter>
        <TransactionSubmitButton
          label="Save changes"
          pendingLabel="Saving changes..."
        />
      </DialogFooter>
    </form>
  );
}
