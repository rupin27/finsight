"use client";

import { Trash2 } from "lucide-react";

import { deleteAccount } from "@/app/(dashboard)/accounts/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
            className="h-9 px-3 text-red-300/55 hover:bg-red-400/10 hover:text-red-200"
          />
        }
      >
        <Trash2 className="size-3.5" />
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent className="border-white/10 bg-[#0b0f17] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {accountName}?</AlertDialogTitle>

          <AlertDialogDescription className="text-white/40">
            This permanently removes the account. An account containing
            transactions cannot be deleted and should be deactivated instead.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <form action={deleteAccountWithId}>
            <Button type="submit" variant="destructive">
              Delete account
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
