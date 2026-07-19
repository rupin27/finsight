"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createAccount } from "@/app/(dashboard)/accounts/actions";
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
import { FormStatusMessage } from "@/components/forms/form-status-message";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
} from "@/features/accounts/account-action-state";
import { AccountFormFields } from "@/features/accounts/components/account-form-fields";
import { AccountSubmitButton } from "@/features/accounts/components/account-submit-button";

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

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add financial account</DialogTitle>

          <DialogDescription>
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
      toast.success("Account created");

      onSuccess();
      router.refresh();
    }
  }, [onSuccess, router, state.status]);

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col"
      aria-describedby={state.message ? "add-account-status" : undefined}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <FormStatusMessage
          id="add-account-status"
          status={state.status}
          message={state.message}
        />

        <AccountFormFields fieldErrors={state.fieldErrors} />
      </div>

      <DialogFooter>
        <AccountSubmitButton
          label="Create account"
          pendingLabel="Creating account..."
        />
      </DialogFooter>
    </form>
  );
}
