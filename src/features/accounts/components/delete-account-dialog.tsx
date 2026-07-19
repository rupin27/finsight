"use client";

import { useFormStatus } from "react-dom";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

import { deleteAccount } from "@/app/(dashboard)/accounts/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteAccountDialogProps {
  accountId: string;
  accountName: string;
}

export function DeleteAccountDialog({
  accountId,
  accountName,
}: DeleteAccountDialogProps) {
  const deleteAccountWithId = deleteAccount.bind(null, accountId);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Delete ${accountName}`}
            className="text-red-300/60 hover:bg-red-400/10 hover:text-red-200"
          />
        }
      >
        <Trash2 className="size-3.5" />
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="size-5" />
          </AlertDialogMedia>

          <AlertDialogTitle>Delete {accountName}?</AlertDialogTitle>

          <AlertDialogDescription>
            This permanently removes the account. An account containing
            transactions cannot be deleted and should be deactivated instead.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <form action={deleteAccountWithId} className="contents">
            <DeleteAccountButton />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteAccountButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}

      {pending ? "Deleting account..." : "Delete account"}
    </Button>
  );
}
