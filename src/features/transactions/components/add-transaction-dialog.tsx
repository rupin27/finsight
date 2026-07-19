"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { createTransaction } from "@/app/(dashboard)/transactions/actions";
import type { Account } from "@/features/accounts/account.types";
import {
  INITIAL_TRANSACTION_ACTION_STATE,
  type TransactionActionState,
} from "@/features/transactions/transaction-action-state";
import type { TransactionCategory } from "@/features/transactions/transaction.types";
import { TransactionFormFields } from "@/features/transactions/components/transaction-form-fields";
import { TransactionSubmitButton } from "@/features/transactions/components/transaction-submit-button";
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
            className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          />
        }
      >
        <Plus className="size-4" />
        Add transaction
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0b0f17] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>

          <DialogDescription className="text-white/40">
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
      onSuccess();
      router.refresh();
    }
  }, [onSuccess, router, state.status]);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {state.message}
        </div>
      )}

      <TransactionFormFields
        accounts={accounts}
        categories={categories}
        fieldErrors={state.fieldErrors}
      />

      <DialogFooter>
        <TransactionSubmitButton
          label="Create transaction"
          pendingLabel="Creating transaction..."
        />
      </DialogFooter>
    </form>
  );
}
