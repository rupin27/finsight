"use client";

import { Trash2 } from "lucide-react";

import { deleteTransaction } from "@/app/(dashboard)/transactions/actions";
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
            aria-label="Delete transaction"
            className="text-red-300/50 hover:bg-red-400/10 hover:text-red-200"
          />
        }
      >
        <Trash2 className="size-3.5" />
      </AlertDialogTrigger>

      <AlertDialogContent className="border-white/10 bg-[#0b0f17] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction?</AlertDialogTitle>

          <AlertDialogDescription className="text-white/40">
            “{description}” will be permanently removed. Any affected account
            and loan balances will be recalculated.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>

          <form action={action}>
            <Button type="submit" variant="destructive">
              Delete transaction
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
