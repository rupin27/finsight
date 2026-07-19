"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Settings2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { saveLoanProfile } from "@/app/(dashboard)/loans/actions";
import {
  INITIAL_LOAN_PROFILE_ACTION_STATE,
  type LoanProfileActionState,
} from "@/features/loans/loan-profile-action-state";
import type { StudentLoanRecord } from "@/features/loans/loan.types";
import { LoanProfileFormFields } from "@/features/loans/components/loan-profile-form-fields";
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

interface LoanProfileDialogProps {
  loan: StudentLoanRecord;
}

export function LoanProfileDialog({ loan }: LoanProfileDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={loan.profile ? "outline" : "default"}
            className={
              loan.profile
                ? "border-white/10 bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white"
                : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            }
          />
        }
      >
        {loan.profile ? (
          <Pencil className="size-4" />
        ) : (
          <Settings2 className="size-4" />
        )}

        {loan.profile ? "Edit repayment details" : "Configure loan"}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#0b0f17] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {loan.profile
              ? "Edit repayment details"
              : "Configure loan optimizer"}
          </DialogTitle>

          <DialogDescription className="text-white/40">
            Add the lender’s current interest rate, required EMI, and next
            payment date for {loan.accountName}.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <LoanProfileForm
            loan={loan}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoanProfileForm({
  loan,
  onSuccess,
}: {
  loan: StudentLoanRecord;
  onSuccess: () => void;
}) {
  const router = useRouter();

  const action = saveLoanProfile.bind(null, loan.accountId);

  const [state, formAction] = useActionState<LoanProfileActionState, FormData>(
    action,
    INITIAL_LOAN_PROFILE_ACTION_STATE,
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

      <LoanProfileFormFields loan={loan} fieldErrors={state.fieldErrors} />

      <DialogFooter>
        <LoanProfileSubmitButton />
      </DialogFooter>
    </form>
  );
}

function LoanProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? "Saving repayment details..." : "Save repayment details"}
    </Button>
  );
}
