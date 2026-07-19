"use client";

import { useFormStatus } from "react-dom";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

import { deleteTransaction } from "@/app/(dashboard)/transactions/actions";
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

interface DeleteTransactionDialogProps {
  transactionId: string;
  description: string;
}

export function DeleteTransactionDialog({
  transactionId,
  description,
}: DeleteTransactionDialogProps) {
  const action = deleteTransaction.bind(null, transactionId);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${description}`}
            className="text-red-300/55 hover:bg-red-400/10 hover:text-red-200"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle className="size-5" />
          </AlertDialogMedia>

          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>

          <AlertDialogDescription>
            “{description}” will be permanently removed. Any affected account
            and loan balances will be recalculated.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <form action={action} className="contents">
            <DeleteTransactionButton />
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteTransactionButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}

      {pending ? "Deleting transaction..." : "Delete transaction"}
    </Button>
  );
}
