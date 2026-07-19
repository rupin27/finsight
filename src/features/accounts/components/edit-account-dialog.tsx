"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { updateAccount } from "@/app/(dashboard)/accounts/actions";
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
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
} from "@/features/accounts/account-action-state";
import { AccountFormFields } from "@/features/accounts/components/account-form-fields";
import { AccountSubmitButton } from "@/features/accounts/components/account-submit-button";
import type { Account } from "@/features/accounts/account.types";

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
            size="sm"
            aria-label={`Edit ${account.name}`}
            className="text-white/45 hover:bg-white/[0.06] hover:text-white"
          />
        }
      >
        <Pencil className="size-3.5" />
        Edit
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>

          <DialogDescription>
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
      toast.success("Account updated");

      onSuccess();
      router.refresh();
    }
  }, [onSuccess, router, state.status]);

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col"
      aria-describedby={state.message ? "edit-account-status" : undefined}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <FormStatusMessage
          id="edit-account-status"
          status={state.status}
          message={state.message}
        />

        <AccountFormFields
          defaultValues={account}
          fieldErrors={state.fieldErrors}
        />
      </div>

      <DialogFooter>
        <AccountSubmitButton
          label="Save changes"
          pendingLabel="Saving changes..."
        />
      </DialogFooter>
    </form>
  );
}
