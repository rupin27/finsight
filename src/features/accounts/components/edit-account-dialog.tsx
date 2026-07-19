"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { updateAccount } from "@/app/(dashboard)/accounts/actions";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
} from "@/features/accounts/account-action-state";
import type { Account } from "@/features/accounts/account.types";
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

interface EditAccountDialogProps {
  account: Account;
}

export function EditAccountDialog({ account }: EditAccountDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-3 text-white/45 hover:bg-white/[0.06] hover:text-white"
          />
        }
      >
        <Pencil className="size-3.5" />
        Edit
      </DialogTrigger>

      <DialogContent className="border-white/10 bg-[#0b0f17] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>

          <DialogDescription className="text-white/40">
            Update the account’s institution, currency, type, or starting
            balance.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EditAccountForm
            account={account}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EditAccountFormProps {
  account: Account;
  onSuccess: () => void;
}

function EditAccountForm({ account, onSuccess }: EditAccountFormProps) {
  const router = useRouter();

  const updateAccountWithId = updateAccount.bind(null, account.id);

  const [state, formAction] = useActionState<AccountActionState, FormData>(
    updateAccountWithId,
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

      <AccountFormFields
        defaultValues={account}
        fieldErrors={state.fieldErrors}
      />

      <DialogFooter>
        <AccountSubmitButton
          label="Save changes"
          pendingLabel="Saving changes..."
        />
      </DialogFooter>
    </form>
  );
}
