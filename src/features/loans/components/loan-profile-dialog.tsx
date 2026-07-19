"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { saveLoanProfile } from "@/app/(dashboard)/loans/actions";
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
import { LoanProfileFormFields } from "@/features/loans/components/loan-profile-form-fields";
import {
  INITIAL_LOAN_PROFILE_ACTION_STATE,
  type LoanProfileActionState,
} from "@/features/loans/loan-profile-action-state";
import type { StudentLoanRecord } from "@/features/loans/loan.types";

interface LoanProfileDialogProps {
  loan: StudentLoanRecord;
}

export function LoanProfileDialog({ loan }: LoanProfileDialogProps) {
  const [open, setOpen] = useState(false);

  const isConfigured = Boolean(loan.profile);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={isConfigured ? "outline" : "default"}
            aria-label={
              isConfigured
                ? `Edit repayment details for ${loan.accountName}`
                : `Configure ${loan.accountName}`
            }
            className={
              isConfigured
                ? "border-white/10 bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white"
                : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            }
          />
        }
      >
        {isConfigured ? (
          <Pencil className="size-4" />
        ) : (
          <Settings2 className="size-4" />
        )}

        {isConfigured ? "Edit repayment details" : "Configure loan"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isConfigured
              ? "Edit repayment details"
              : "Configure loan optimizer"}
          </DialogTitle>

          <DialogDescription>
            Add the lender’s current interest rate, required payment, and next
            payment date for{" "}
            <span className="font-medium text-white/65">
              {loan.accountName}
            </span>
            .
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

  const formId = useId();

  const statusId = `${formId}-status`;

  const action = saveLoanProfile.bind(null, loan.accountId);

  const [state, formAction] = useActionState<LoanProfileActionState, FormData>(
    action,
    INITIAL_LOAN_PROFILE_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Loan repayment profile saved.");

      onSuccess();
      router.refresh();
    }
  }, [onSuccess, router, state.message, state.status]);

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col"
      aria-describedby={state.message ? statusId : undefined}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <FormStatusMessage
          id={statusId}
          status={state.status}
          message={state.message}
        />

        <LoanProfileFormFields
          loan={loan}
          fieldErrors={state.fieldErrors}
          idPrefix={formId}
        />
      </div>

      <DialogFooter>
        <LoanProfileSubmitButton isEditing={Boolean(loan.profile)} />
      </DialogFooter>
    </form>
  );
}

function LoanProfileSubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending
        ? "Saving repayment details..."
        : isEditing
          ? "Save changes"
          : "Configure loan"}
    </Button>
  );
}
