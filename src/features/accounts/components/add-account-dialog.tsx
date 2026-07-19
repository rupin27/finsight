"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createAccount } from "@/app/(dashboard)/accounts/actions";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
} from "@/features/accounts/account-action-state";
import { AccountFormFields } from "@/features/accounts/components/account-form-fields";
import { AccountSubmitButton } from "@/features/accounts/components/account-submit-button";
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

export function AddAccountDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
          />
        }
      >
        <Plus className="size-4" />
        Add account
      </DialogTrigger>

      <DialogContent className="border-white/10 bg-[#0b0f17] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add financial account</DialogTitle>

          <DialogDescription className="text-white/40">
            Add a bank, cash, or loan account. The account will remain in its
            original currency.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <AddAccountForm
            onSuccess={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AddAccountFormProps {
  onSuccess: () => void;
}

function AddAccountForm({ onSuccess }: AddAccountFormProps) {
  const router = useRouter();

  const [state, formAction] = useActionState<AccountActionState, FormData>(
    createAccount,
    INITIAL_ACCOUNT_ACTION_STATE,
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

      <AccountFormFields fieldErrors={state.fieldErrors} />

      <DialogFooter>
        <AccountSubmitButton
          label="Create account"
          pendingLabel="Creating account..."
        />
      </DialogFooter>
    </form>
  );
}
