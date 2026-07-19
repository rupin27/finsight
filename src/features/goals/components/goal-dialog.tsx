"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import {
  createFinancialGoal,
  updateFinancialGoal,
} from "@/app/(dashboard)/goals/actions";
import {
  ACCOUNT_CURRENCIES,
  type Account,
} from "@/features/accounts/account.types";
import {
  INITIAL_GOAL_ACTION_STATE,
  type GoalActionState,
} from "@/features/goals/goal-action-state";
import {
  FINANCIAL_GOAL_TYPES,
  FINANCIAL_GOAL_TYPE_LABELS,
  type FinancialGoalRecord,
  type FinancialGoalType,
  type GoalProgressSource,
} from "@/features/goals/goal.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GoalDialogProps {
  accounts: Account[];
  goal?: FinancialGoalRecord;
}

export function GoalDialog({ accounts, goal }: GoalDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={goal ? "outline" : "default"}
            size={goal ? "sm" : "default"}
            className={
              goal
                ? "border-white/10 bg-transparent text-white/50 hover:bg-white/[0.06] hover:text-white"
                : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            }
          />
        }
      >
        {goal ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}

        {goal ? "Edit" : "Add goal"}
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#0b0f17] text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {goal ? "Edit financial goal" : "Create financial goal"}
          </DialogTitle>

          <DialogDescription className="text-white/40">
            Track savings, emergency funds, custom targets, or loan payoff.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <GoalForm
            accounts={accounts}
            goal={goal}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GoalForm({
  accounts,
  goal,
  onSuccess,
}: GoalDialogProps & {
  onSuccess: () => void;
}) {
  const router = useRouter();

  const action: (
    previousState: GoalActionState,
    formData: FormData,
  ) => Promise<GoalActionState> = goal
    ? updateFinancialGoal.bind(null, goal.id)
    : createFinancialGoal;

  const [state, formAction] = useActionState(action, INITIAL_GOAL_ACTION_STATE);

  const [goalType, setGoalType] = useState<FinancialGoalType>(
    goal?.goalType ?? "savings",
  );

  const [progressSource, setProgressSource] = useState<GoalProgressSource>(
    goal?.progressSource ?? "manual",
  );

  const effectiveProgressSource =
    goalType === "loan_payoff" ? "linked_account" : progressSource;

  const availableAccounts = accounts.filter((account) => {
    if (goalType === "loan_payoff") {
      return account.accountType === "loan";
    }

    return account.accountType !== "loan";
  });

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

      <input
        type="hidden"
        name="progressSource"
        value={effectiveProgressSource}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Goal name"
          error={state.fieldErrors?.name?.[0]}
          className="sm:col-span-2"
        >
          <Input
            name="name"
            defaultValue={goal?.name ?? ""}
            placeholder="Example: Dublin emergency fund"
            required
            className="border-white/10 bg-white/[0.04] text-white"
          />
        </Field>

        <Field label="Goal type" error={state.fieldErrors?.goalType?.[0]}>
          <select
            name="goalType"
            value={goalType}
            onChange={(event) => {
              setGoalType(event.target.value as FinancialGoalType);
            }}
            className={selectClassName}
          >
            {FINANCIAL_GOAL_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[#0b0f17]">
                {FINANCIAL_GOAL_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Currency" error={state.fieldErrors?.currency?.[0]}>
          <select
            name="currency"
            defaultValue={goal?.currency ?? "USD"}
            className={selectClassName}
          >
            {ACCOUNT_CURRENCIES.map((currency) => (
              <option key={currency} value={currency} className="bg-[#0b0f17]">
                {currency}
              </option>
            ))}
          </select>
        </Field>

        {goalType !== "loan_payoff" && (
          <Field
            label="Progress source"
            error={state.fieldErrors?.progressSource?.[0]}
          >
            <select
              value={progressSource}
              onChange={(event) => {
                setProgressSource(event.target.value as GoalProgressSource);
              }}
              className={selectClassName}
            >
              <option value="manual" className="bg-[#0b0f17]">
                Enter progress manually
              </option>

              <option value="linked_account" className="bg-[#0b0f17]">
                Use an account balance
              </option>
            </select>
          </Field>
        )}

        {effectiveProgressSource === "linked_account" && (
          <Field
            label={
              goalType === "loan_payoff" ? "Loan account" : "Linked account"
            }
            error={state.fieldErrors?.linkedAccountId?.[0]}
          >
            <select
              name="linkedAccountId"
              defaultValue={goal?.linkedAccountId ?? ""}
              required
              className={selectClassName}
            >
              <option value="" className="bg-[#0b0f17]">
                Select an account
              </option>

              {availableAccounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                  className="bg-[#0b0f17]"
                >
                  {account.name} · {account.currency}
                </option>
              ))}
            </select>
          </Field>
        )}

        {(goalType === "savings" || goalType === "custom") && (
          <Field
            label="Target amount"
            error={state.fieldErrors?.targetAmount?.[0]}
          >
            <Input
              name="targetAmount"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={goal?.targetAmount ?? ""}
              required
              className="border-white/10 bg-white/[0.04] text-white"
            />
          </Field>
        )}

        {goalType === "emergency_fund" && (
          <Field
            label="Months of expenses"
            error={state.fieldErrors?.emergencyFundMonths?.[0]}
          >
            <select
              name="emergencyFundMonths"
              defaultValue={goal?.emergencyFundMonths ?? 6}
              className={selectClassName}
            >
              {[3, 6, 9, 12].map((months) => (
                <option key={months} value={months} className="bg-[#0b0f17]">
                  {months} months
                </option>
              ))}
            </select>
          </Field>
        )}

        {effectiveProgressSource === "manual" && (
          <Field
            label="Current progress"
            error={state.fieldErrors?.manualCurrentAmount?.[0]}
          >
            <Input
              name="manualCurrentAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={goal?.manualCurrentAmount ?? 0}
              className="border-white/10 bg-white/[0.04] text-white"
            />
          </Field>
        )}

        {effectiveProgressSource === "linked_account" && (
          <input type="hidden" name="manualCurrentAmount" value="0" />
        )}

        <Field
          label={
            goalType === "loan_payoff"
              ? "Planned extra monthly payment"
              : "Planned monthly contribution"
          }
          error={state.fieldErrors?.plannedMonthlyContribution?.[0]}
        >
          <Input
            name="plannedMonthlyContribution"
            type="number"
            min="0"
            step="0.01"
            defaultValue={goal?.plannedMonthlyContribution ?? 0}
            className="border-white/10 bg-white/[0.04] text-white"
          />
        </Field>

        <Field label="Target date" error={state.fieldErrors?.targetDate?.[0]}>
          <Input
            name="targetDate"
            type="date"
            defaultValue={goal?.targetDate ?? ""}
            className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
          />
        </Field>

        <Field label="Priority" error={state.fieldErrors?.priority?.[0]}>
          <select
            name="priority"
            defaultValue={goal?.priority ?? 3}
            className={selectClassName}
          >
            <option value="1" className="bg-[#0b0f17]">
              1 · Highest
            </option>

            <option value="2" className="bg-[#0b0f17]">
              2 · High
            </option>

            <option value="3" className="bg-[#0b0f17]">
              3 · Normal
            </option>

            <option value="4" className="bg-[#0b0f17]">
              4 · Low
            </option>

            <option value="5" className="bg-[#0b0f17]">
              5 · Lowest
            </option>
          </select>
        </Field>

        <Field
          label="Notes"
          error={state.fieldErrors?.notes?.[0]}
          className="sm:col-span-2"
        >
          <textarea
            name="notes"
            defaultValue={goal?.notes ?? ""}
            rows={4}
            className="w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
          />
        </Field>
      </div>

      <DialogFooter>
        <GoalSubmitButton />
      </DialogFooter>
    </form>
  );
}

function GoalSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? "Saving goal..." : "Save goal"}
    </Button>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-white/65">{label}</Label>

      {children}

      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40";
