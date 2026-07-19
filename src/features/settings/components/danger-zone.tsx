"use client";

import {
  type FormEvent,
  type ReactNode,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteAllTransactions,
  resetFinancialData,
} from "@/app/(dashboard)/settings/data-actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INITIAL_SETTINGS_ACTION_STATE,
  type SettingsActionState,
} from "@/features/settings/settings-action-state";
import type { SettingsPageData } from "@/features/settings/settings.types";

interface DangerZoneProps {
  data: SettingsPageData;
}

type DangerServerAction = (
  previousState: SettingsActionState,
  formData: FormData,
) => Promise<SettingsActionState>;

export function DangerZone({ data }: DangerZoneProps) {
  return (
    <section
      aria-labelledby="danger-zone-heading"
      className="overflow-hidden rounded-2xl border border-red-400/20 bg-red-400/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-red-400/15 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="size-4 text-red-300" />

          <h2 id="danger-zone-heading" className="section-title text-red-100">
            Danger zone
          </h2>
        </div>

        <p className="mt-2 text-sm leading-6 text-red-100/45">
          These actions cannot be undone. Export your data before continuing.
        </p>
      </header>

      <div className="divide-y divide-red-400/10">
        <DangerActionRow
          title="Delete all transactions"
          description={
            <>
              Permanently deletes{" "}
              <strong className="financial-number font-semibold text-white/55">
                {data.dataCounts.transactions}
              </strong>{" "}
              transaction
              {data.dataCounts.transactions === 1 ? "" : "s"}. Accounts, loan
              profiles, and goals remain.
            </>
          }
        >
          <ServerDangerDialog
            triggerLabel="Delete transactions"
            title="Delete every transaction?"
            description="All recorded income, expenses, loan payments, recurring schedules, and imported transactions will be permanently removed. Accounts, loan profiles, and goals will remain."
            confirmationPhrase="DELETE TRANSACTIONS"
            confirmationLabel="Type DELETE TRANSACTIONS to continue"
            submitLabel="Delete transactions"
            pendingLabel="Deleting transactions..."
            action={deleteAllTransactions}
            successToast="All transactions were deleted."
          />
        </DangerActionRow>

        <DangerActionRow
          title="Reset financial data"
          description={
            <>
              Deletes{" "}
              <strong className="financial-number font-semibold text-white/55">
                {data.dataCounts.accounts}
              </strong>{" "}
              accounts,{" "}
              <strong className="financial-number font-semibold text-white/55">
                {data.dataCounts.transactions}
              </strong>{" "}
              transactions,{" "}
              <strong className="financial-number font-semibold text-white/55">
                {data.dataCounts.loanProfiles}
              </strong>{" "}
              loan profiles, and{" "}
              <strong className="financial-number font-semibold text-white/55">
                {data.dataCounts.financialGoals}
              </strong>{" "}
              goals. Your login, preferences, and AI usage metadata remain.
            </>
          }
        >
          <ServerDangerDialog
            triggerLabel="Reset financial data"
            title="Reset all financial data?"
            description="This permanently removes accounts, transactions, loan profiles, and financial goals. Your authentication account, settings, and AI usage metadata will remain."
            confirmationPhrase="RESET FINSIGHT"
            confirmationLabel="Type RESET FINSIGHT to continue"
            submitLabel="Reset financial data"
            pendingLabel="Resetting FinSight..."
            action={resetFinancialData}
            successToast="Financial data was reset."
          />
        </DangerActionRow>

        <DangerActionRow
          title="Permanently delete account"
          description="Deletes your Supabase authentication user and all FinSight data attached to your account through cascading ownership."
          critical
        >
          <DeleteAccountDialog
            requiresPassword={data.usesPasswordAuthentication}
          />
        </DangerActionRow>
      </div>
    </section>
  );
}

function DangerActionRow({
  title,
  description,
  critical = false,
  children,
}: {
  title: string;
  description: ReactNode;
  critical?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div>
        <h3
          className={
            critical
              ? "text-sm font-semibold text-red-200"
              : "text-sm font-semibold text-white/75"
          }
        >
          {title}
        </h3>

        <p className="mt-2 max-w-3xl text-xs leading-5 text-white/32">
          {description}
        </p>

        {critical && (
          <p className="mt-2 text-xs font-semibold text-red-200/70">
            This also removes your ability to sign in and cannot be reversed.
          </p>
        )}
      </div>

      <div className="lg:justify-self-end">{children}</div>
    </div>
  );
}

function ServerDangerDialog({
  triggerLabel,
  title,
  description,
  confirmationPhrase,
  confirmationLabel,
  submitLabel,
  pendingLabel,
  action,
  successToast,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmationPhrase: string;
  confirmationLabel: string;
  submitLabel: string;
  pendingLabel: string;
  action: DangerServerAction;
  successToast: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full border-red-400/25 bg-red-400/[0.06] text-red-200 hover:bg-red-400/15 hover:text-red-100 sm:w-auto"
          />
        }
      >
        <Trash2 className="size-4" />
        {triggerLabel}
      </AlertDialogTrigger>

      <AlertDialogContent>
        {open && (
          <ServerDangerForm
            title={title}
            description={description}
            confirmationPhrase={confirmationPhrase}
            confirmationLabel={confirmationLabel}
            submitLabel={submitLabel}
            pendingLabel={pendingLabel}
            action={action}
            successToast={successToast}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ServerDangerForm({
  title,
  description,
  confirmationPhrase,
  confirmationLabel,
  submitLabel,
  pendingLabel,
  action,
  successToast,
  onSuccess,
}: {
  title: string;
  description: string;
  confirmationPhrase: string;
  confirmationLabel: string;
  submitLabel: string;
  pendingLabel: string;
  action: DangerServerAction;
  successToast: string;
  onSuccess: () => void;
}) {
  const router = useRouter();

  const idPrefix = useId();

  const confirmationId = `${idPrefix}-confirmation`;

  const statusId = `${idPrefix}-status`;

  const [confirmation, setConfirmation] = useState("");

  const [state, formAction] = useActionState(
    action,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  const valid = confirmation === confirmationPhrase;

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? successToast);

      onSuccess();
      router.refresh();
    }
  }, [onSuccess, router, state.message, state.status, successToast]);

  return (
    <form action={formAction}>
      <AlertDialogHeader>
        <AlertDialogMedia>
          <AlertTriangle className="size-5" />
        </AlertDialogMedia>

        <AlertDialogTitle>{title}</AlertDialogTitle>

        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-4 px-6 pb-5">
        <FormStatusMessage
          id={statusId}
          status={state.status}
          message={state.message}
        />

        <div className="space-y-2">
          <Label htmlFor={confirmationId} className="text-red-100/75">
            {confirmationLabel}
          </Label>

          <Input
            id={confirmationId}
            name="confirmation"
            value={confirmation}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={state.message ? statusId : undefined}
            onChange={(event) => {
              setConfirmation(event.target.value);
            }}
            className="border-red-400/25 bg-red-400/[0.04] font-mono text-white placeholder:text-white/20 focus-visible:border-red-300/45 focus-visible:ring-red-300/15"
          />
        </div>
      </div>

      <DangerFormFooter
        valid={valid}
        submitLabel={submitLabel}
        pendingLabel={pendingLabel}
      />
    </form>
  );
}

function DangerFormFooter({
  valid,
  submitLabel,
  pendingLabel,
}: {
  valid: boolean;
  submitLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <AlertDialogFooter>
      <AlertDialogCancel type="button" disabled={pending}>
        Cancel
      </AlertDialogCancel>

      <Button type="submit" variant="destructive" disabled={pending || !valid}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}

        {pending ? pendingLabel : submitLabel}
      </Button>
    </AlertDialogFooter>
  );
}

function DeleteAccountDialog({
  requiresPassword,
}: {
  requiresPassword: boolean;
}) {
  const [open, setOpen] = useState(false);

  const [confirmation, setConfirmation] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const idPrefix = useId();

  const confirmationId = `${idPrefix}-confirmation`;

  const passwordId = `${idPrefix}-password`;

  const errorRef = useRef<HTMLDivElement>(null);

  const valid =
    confirmation === "DELETE MY ACCOUNT" &&
    (!requiresPassword || currentPassword.length > 0);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  function handleOpenChange(nextOpen: boolean) {
    if (deleting) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setConfirmation("");
      setCurrentPassword("");
      setError(null);
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!valid || deleting) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          confirmation,

          currentPassword: requiresPassword ? currentPassword : undefined,
        }),
      });

      const responseText = await response.text();

      let result: {
        success: boolean;
        error?: string;
      };

      try {
        result = JSON.parse(responseText) as {
          success: boolean;
          error?: string;
        };
      } catch {
        throw new Error(
          "The deletion service returned an unreadable response.",
        );
      }

      if (!response.ok || !result.success) {
        setError(result.error ?? "The account could not be deleted.");

        return;
      }

      window.location.assign("/login?accountDeleted=1");
    } catch (deletionError) {
      setError(
        deletionError instanceof Error
          ? deletionError.message
          : "FinSight could not reach the deletion service.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="w-full border-red-400/30 bg-red-400/[0.08] text-red-200 hover:bg-red-400/20 hover:text-red-100 sm:w-auto"
          />
        }
      >
        <Trash2 className="size-4" />
        Delete account
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form onSubmit={deleteAccount}>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-5" />
            </AlertDialogMedia>

            <AlertDialogTitle>
              Permanently delete your FinSight account?
            </AlertDialogTitle>

            <AlertDialogDescription>
              This deletes your authentication user and all FinSight records
              owned by your account. You will be signed out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 px-6 pb-5">
            {error && (
              <div
                ref={errorRef}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200 outline-none"
              >
                {error}
              </div>
            )}

            {requiresPassword && (
              <div className="space-y-2">
                <Label htmlFor={passwordId} className="text-red-100/75">
                  Current password
                </Label>

                <Input
                  id={passwordId}
                  type="password"
                  value={currentPassword}
                  required
                  disabled={deleting}
                  autoComplete="current-password"
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                  }}
                  className="border-red-400/25 bg-red-400/[0.04] text-white focus-visible:border-red-300/45 focus-visible:ring-red-300/15"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={confirmationId} className="text-red-100/75">
                Type DELETE MY ACCOUNT to continue
              </Label>

              <Input
                id={confirmationId}
                value={confirmation}
                required
                disabled={deleting}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                }}
                className="border-red-400/25 bg-red-400/[0.04] font-mono text-white focus-visible:border-red-300/45 focus-visible:ring-red-300/15"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={deleting}>
              Cancel
            </AlertDialogCancel>

            <Button
              type="submit"
              variant="destructive"
              disabled={deleting || !valid}
            >
              {deleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}

              {deleting ? "Deleting account..." : "Delete account permanently"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
