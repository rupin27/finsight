"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createTransaction } from "@/app/(dashboard)/transactions/actions";
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
import type { TransactionCategory } from "@/features/transactions/transaction.types";

interface AddTransactionDialogProps {
  accounts: Account[];
  categories: TransactionCategory[];
}

export function AddTransactionDialog({
  accounts,
  categories,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);

  const canCreate = accounts.some(
    (account) => account.isActive && account.accountType !== "loan",
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            disabled={!canCreate}
            aria-describedby={
              !canCreate ? "add-transaction-disabled-reason" : undefined
            }
            className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          />
        }
      >
        <Plus className="size-4" />
        Add transaction
      </DialogTrigger>

      {!canCreate && (
        <span id="add-transaction-disabled-reason" className="sr-only">
          Create an active non-loan account before adding a transaction.
        </span>
      )}

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>

          <DialogDescription>
            Record income, an expense, or a student-loan payment.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <AddTransactionForm
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

interface AddTransactionFormProps {
  accounts: Account[];

  categories: TransactionCategory[];

  onSuccess: () => void;
}

function AddTransactionForm({
  accounts,
  categories,
  onSuccess,
}: AddTransactionFormProps) {
  const router = useRouter();

  const [state, formAction] = useActionState<TransactionActionState, FormData>(
    createTransaction,
    INITIAL_TRANSACTION_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Transaction created");

      onSuccess();
      router.refresh();
    }
  }, [onSuccess, router, state.status]);

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col"
      aria-describedby={state.message ? "add-transaction-status" : undefined}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <FormStatusMessage
          id="add-transaction-status"
          status={state.status}
          message={state.message}
        />

        <TransactionFormFields
          accounts={accounts}
          categories={categories}
          fieldErrors={state.fieldErrors}
        />
      </div>

      <DialogFooter>
        <TransactionSubmitButton
          label="Create transaction"
          pendingLabel="Creating transaction..."
        />
      </DialogFooter>
    </form>
  );
}
