"use client";

import {
  useActionState,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createFinancialGoal,
  updateFinancialGoal,
} from "@/app/(dashboard)/goals/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface GoalDialogProps {
  accounts: Account[];
  goal?: FinancialGoalRecord;
}

export function GoalDialog({ accounts, goal }: GoalDialogProps) {
  const [open, setOpen] = useState(false);

  const isEditing = Boolean(goal);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={isEditing ? "outline" : "default"}
            size={isEditing ? "sm" : "default"}
            aria-label={goal ? `Edit ${goal.name}` : undefined}
            className={
              isEditing
                ? "border-white/10 bg-transparent text-white/55 hover:bg-white/[0.06] hover:text-white"
                : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            }
          />
        }
      >
        {isEditing ? (
          <Pencil className="size-3.5" />
        ) : (
          <Plus className="size-4" />
        )}

        {isEditing ? "Edit" : "Add goal"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit financial goal" : "Create financial goal"}
          </DialogTitle>

          <DialogDescription>
            Track savings, emergency funds, custom targets, or loan payoff
            progress.
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

interface GoalFormProps {
  accounts: Account[];
  goal?: FinancialGoalRecord;
  onSuccess: () => void;
}

function GoalForm({ accounts, goal, onSuccess }: GoalFormProps) {
  const router = useRouter();

  const formId = useId();

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

  const requiresLinkedAccount = effectiveProgressSource === "linked_account";

  const missingRequiredAccount =
    requiresLinkedAccount && availableAccounts.length === 0;

  const ids = {
    status: `${formId}-status`,

    name: `${formId}-name`,

    goalType: `${formId}-goal-type`,

    currency: `${formId}-currency`,

    progressSource: `${formId}-progress-source`,

    linkedAccount: `${formId}-linked-account`,

    targetAmount: `${formId}-target-amount`,

    emergencyFundMonths: `${formId}-emergency-months`,

    manualCurrentAmount: `${formId}-manual-current`,

    monthlyContribution: `${formId}-monthly-contribution`,

    targetDate: `${formId}-target-date`,

    priority: `${formId}-priority`,

    notes: `${formId}-notes`,

    accountRequirement: `${formId}-account-requirement`,
  };

  useEffect(() => {
    if (state.status === "success") {
      toast.success(
        state.message ??
          (goal ? "Financial goal updated." : "Financial goal created."),
      );

      onSuccess();
      router.refresh();
    }
  }, [goal, onSuccess, router, state.message, state.status]);

  return (
    <form
      action={formAction}
      className="flex min-h-0 flex-1 flex-col"
      aria-describedby={state.message ? ids.status : undefined}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <FormStatusMessage
          id={ids.status}
          status={state.status}
          message={state.message}
        />

        <input
          type="hidden"
          name="progressSource"
          value={effectiveProgressSource}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id={ids.name}
            label="Goal name"
            error={state.fieldErrors?.name?.[0]}
            className="sm:col-span-2"
          >
            <Input
              id={ids.name}
              name="name"
              defaultValue={goal?.name ?? ""}
              placeholder="Example: Dublin emergency fund"
              autoComplete="off"
              required
              aria-invalid={Boolean(state.fieldErrors?.name?.[0])}
              aria-describedby={getFieldDescriptionId(
                ids.name,
                state.fieldErrors?.name?.[0],
              )}
            />
          </Field>

          <Field
            id={ids.goalType}
            label="Goal type"
            error={state.fieldErrors?.goalType?.[0]}
          >
            <select
              id={ids.goalType}
              name="goalType"
              value={goalType}
              onChange={(event) => {
                setGoalType(event.target.value as FinancialGoalType);
              }}
              aria-invalid={Boolean(state.fieldErrors?.goalType?.[0])}
              aria-describedby={getFieldDescriptionId(
                ids.goalType,
                state.fieldErrors?.goalType?.[0],
              )}
              className={selectClassName}
            >
              {FINANCIAL_GOAL_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[#0b0f17]">
                  {FINANCIAL_GOAL_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id={ids.currency}
            label="Goal currency"
            description="Targets and progress will be displayed in this currency."
            error={state.fieldErrors?.currency?.[0]}
          >
            <select
              id={ids.currency}
              name="currency"
              defaultValue={goal?.currency ?? "USD"}
              aria-invalid={Boolean(state.fieldErrors?.currency?.[0])}
              aria-describedby={getFieldDescriptionId(
                ids.currency,
                state.fieldErrors?.currency?.[0],
                true,
              )}
              className={selectClassName}
            >
              {ACCOUNT_CURRENCIES.map((currency) => (
                <option
                  key={currency}
                  value={currency}
                  className="bg-[#0b0f17]"
                >
                  {currency}
                </option>
              ))}
            </select>
          </Field>

          {goalType !== "loan_payoff" && (
            <Field
              id={ids.progressSource}
              label="Progress source"
              description="Choose whether to enter progress manually or track an account balance."
              error={state.fieldErrors?.progressSource?.[0]}
            >
              <select
                id={ids.progressSource}
                value={progressSource}
                onChange={(event) => {
                  setProgressSource(event.target.value as GoalProgressSource);
                }}
                aria-invalid={Boolean(state.fieldErrors?.progressSource?.[0])}
                aria-describedby={getFieldDescriptionId(
                  ids.progressSource,
                  state.fieldErrors?.progressSource?.[0],
                  true,
                )}
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

          {requiresLinkedAccount && (
            <Field
              id={ids.linkedAccount}
              label={
                goalType === "loan_payoff" ? "Loan account" : "Linked account"
              }
              description={
                goalType === "loan_payoff"
                  ? "The outstanding loan balance will determine payoff progress."
                  : "The current account balance will determine goal progress."
              }
              error={state.fieldErrors?.linkedAccountId?.[0]}
              className={
                goalType === "loan_payoff" ? "sm:col-span-2" : undefined
              }
            >
              <select
                id={ids.linkedAccount}
                name="linkedAccountId"
                defaultValue={goal?.linkedAccountId ?? ""}
                required
                disabled={missingRequiredAccount}
                aria-invalid={Boolean(state.fieldErrors?.linkedAccountId?.[0])}
                aria-describedby={[
                  `${ids.linkedAccount}-description`,

                  state.fieldErrors?.linkedAccountId?.[0]
                    ? `${ids.linkedAccount}-error`
                    : null,

                  missingRequiredAccount ? ids.accountRequirement : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
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
                    {account.name}
                    {" · "}
                    {account.currency}
                  </option>
                ))}
              </select>

              {missingRequiredAccount && (
                <p
                  id={ids.accountRequirement}
                  role="alert"
                  className="rounded-xl border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2.5 text-xs leading-5 text-amber-200"
                >
                  {goalType === "loan_payoff"
                    ? "Create a loan account before creating a loan-payoff goal."
                    : "Create an active non-loan account before linking this goal."}
                </p>
              )}
            </Field>
          )}

          {(goalType === "savings" || goalType === "custom") && (
            <Field
              id={ids.targetAmount}
              label="Target amount"
              error={state.fieldErrors?.targetAmount?.[0]}
            >
              <Input
                id={ids.targetAmount}
                name="targetAmount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                defaultValue={goal?.targetAmount ?? ""}
                placeholder="0.00"
                required
                aria-invalid={Boolean(state.fieldErrors?.targetAmount?.[0])}
                aria-describedby={getFieldDescriptionId(
                  ids.targetAmount,
                  state.fieldErrors?.targetAmount?.[0],
                )}
              />
            </Field>
          )}

          {goalType === "emergency_fund" && (
            <Field
              id={ids.emergencyFundMonths}
              label="Months of expenses"
              description="FinSight uses projected monthly expenses to calculate the target."
              error={state.fieldErrors?.emergencyFundMonths?.[0]}
            >
              <select
                id={ids.emergencyFundMonths}
                name="emergencyFundMonths"
                defaultValue={goal?.emergencyFundMonths ?? 6}
                aria-invalid={Boolean(
                  state.fieldErrors?.emergencyFundMonths?.[0],
                )}
                aria-describedby={getFieldDescriptionId(
                  ids.emergencyFundMonths,
                  state.fieldErrors?.emergencyFundMonths?.[0],
                  true,
                )}
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
              id={ids.manualCurrentAmount}
              label="Current progress"
              error={state.fieldErrors?.manualCurrentAmount?.[0]}
            >
              <Input
                id={ids.manualCurrentAmount}
                name="manualCurrentAmount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={goal?.manualCurrentAmount ?? 0}
                aria-invalid={Boolean(
                  state.fieldErrors?.manualCurrentAmount?.[0],
                )}
                aria-describedby={getFieldDescriptionId(
                  ids.manualCurrentAmount,
                  state.fieldErrors?.manualCurrentAmount?.[0],
                )}
              />
            </Field>
          )}

          {effectiveProgressSource === "linked_account" && (
            <input type="hidden" name="manualCurrentAmount" value="0" />
          )}

          <Field
            id={ids.monthlyContribution}
            label={
              goalType === "loan_payoff"
                ? "Planned extra monthly payment"
                : "Planned monthly contribution"
            }
            description={
              goalType === "loan_payoff"
                ? "This is additional to the normal scheduled loan payment."
                : "This amount is included in your monthly goal allocation."
            }
            error={state.fieldErrors?.plannedMonthlyContribution?.[0]}
          >
            <Input
              id={ids.monthlyContribution}
              name="plannedMonthlyContribution"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={goal?.plannedMonthlyContribution ?? 0}
              aria-invalid={Boolean(
                state.fieldErrors?.plannedMonthlyContribution?.[0],
              )}
              aria-describedby={getFieldDescriptionId(
                ids.monthlyContribution,
                state.fieldErrors?.plannedMonthlyContribution?.[0],
                true,
              )}
            />
          </Field>

          <Field
            id={ids.targetDate}
            label="Target date"
            description="Optional. Adding a date allows FinSight to calculate the required monthly amount."
            error={state.fieldErrors?.targetDate?.[0]}
          >
            <Input
              id={ids.targetDate}
              name="targetDate"
              type="date"
              defaultValue={goal?.targetDate ?? ""}
              aria-invalid={Boolean(state.fieldErrors?.targetDate?.[0])}
              aria-describedby={getFieldDescriptionId(
                ids.targetDate,
                state.fieldErrors?.targetDate?.[0],
                true,
              )}
              className="[color-scheme:dark]"
            />
          </Field>

          <Field
            id={ids.priority}
            label="Priority"
            description="Priority affects how goals are ordered in planning views."
            error={state.fieldErrors?.priority?.[0]}
          >
            <select
              id={ids.priority}
              name="priority"
              defaultValue={goal?.priority ?? 3}
              aria-invalid={Boolean(state.fieldErrors?.priority?.[0])}
              aria-describedby={getFieldDescriptionId(
                ids.priority,
                state.fieldErrors?.priority?.[0],
                true,
              )}
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
            id={ids.notes}
            label="Notes"
            description="Optional private context about this goal."
            error={state.fieldErrors?.notes?.[0]}
            className="sm:col-span-2"
          >
            <Textarea
              id={ids.notes}
              name="notes"
              defaultValue={goal?.notes ?? ""}
              rows={4}
              placeholder="Add any assumptions, reminders, or context..."
              aria-invalid={Boolean(state.fieldErrors?.notes?.[0])}
              aria-describedby={getFieldDescriptionId(
                ids.notes,
                state.fieldErrors?.notes?.[0],
                true,
              )}
            />
          </Field>
        </div>
      </div>

      <DialogFooter>
        <GoalSubmitButton
          isEditing={Boolean(goal)}
          disabled={missingRequiredAccount}
        />
      </DialogFooter>
    </form>
  );
}

function GoalSubmitButton({
  isEditing,
  disabled,
}: {
  isEditing: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending
        ? isEditing
          ? "Saving changes..."
          : "Creating goal..."
        : isEditing
          ? "Save changes"
          : "Create goal"}
    </Button>
  );
}

function Field({
  id,
  label,
  description,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={["space-y-2", className ?? ""].join(" ")}>
      <Label htmlFor={id}>{label}</Label>

      {description && (
        <p id={`${id}-description`} className="text-xs leading-5 text-white/32">
          {description}
        </p>
      )}

      {children}

      {error && (
        <p id={`${id}-error`} className="text-xs leading-5 text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function getFieldDescriptionId(
  id: string,
  error?: string,
  hasDescription = false,
): string | undefined {
  const ids = [
    hasDescription ? `${id}-description` : null,

    error ? `${id}-error` : null,
  ].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
}

const selectClassName = [
  "flex h-10 w-full min-w-0",
  "rounded-xl border border-input",
  "bg-input/20 px-3.5 py-2",
  "text-[0.9375rem] text-white",
  "shadow-sm shadow-black/5",
  "outline-none",
  "transition-[border-color,background-color,box-shadow,opacity]",
  "duration-150",
  "focus-visible:border-cyan-300/45",
  "focus-visible:ring-2",
  "focus-visible:ring-cyan-300/20",
  "disabled:cursor-not-allowed",
  "disabled:opacity-50",
  "aria-invalid:border-destructive",
  "aria-invalid:ring-2",
  "aria-invalid:ring-destructive/20",
].join(" ");
