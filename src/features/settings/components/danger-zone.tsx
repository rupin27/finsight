"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

import {
  deleteAllTransactions,
  resetFinancialData,
} from "@/app/(dashboard)/settings/data-actions";
import { INITIAL_SETTINGS_ACTION_STATE } from "@/features/settings/settings-action-state";
import type { SettingsPageData } from "@/features/settings/settings.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DangerZoneProps {
  data: SettingsPageData;
}

export function DangerZone({ data }: DangerZoneProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-red-400/20 bg-red-400/[0.025]">
      <header className="border-b border-red-400/15 p-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-300" />

          <h2 className="font-medium text-red-100">Danger zone</h2>
        </div>

        <p className="mt-2 text-sm text-red-100/40">
          These actions cannot be undone. Export your data first.
        </p>
      </header>

      <div className="divide-y divide-red-400/10">
        <DeleteTransactionsPanel count={data.dataCounts.transactions} />

        <ResetFinancialDataPanel data={data} />

        <DeleteAccountPanel
          requiresPassword={data.usesPasswordAuthentication}
        />
      </div>
    </section>
  );
}

function DeleteTransactionsPanel({ count }: { count: number }) {
  const [state, action] = useActionState(
    deleteAllTransactions,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  return (
    <form action={action} className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
      <div>
        <h3 className="text-sm font-medium text-white/75">
          Delete all transactions
        </h3>

        <p className="mt-2 text-xs leading-5 text-white/30">
          Permanently deletes {count} transaction
          {count === 1 ? "" : "s"}. Accounts, loan profiles, and goals remain.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          name="confirmation"
          placeholder="DELETE TRANSACTIONS"
          autoComplete="off"
          className="border-red-400/20 bg-red-400/[0.035] text-white placeholder:text-white/20"
        />

        <ActionMessage state={state} />

        <DangerSubmitButton
          label="Delete transactions"
          pendingLabel="Deleting transactions..."
        />
      </div>
    </form>
  );
}

function ResetFinancialDataPanel({ data }: { data: SettingsPageData }) {
  const [state, action] = useActionState(
    resetFinancialData,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  return (
    <form action={action} className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
      <div>
        <h3 className="text-sm font-medium text-white/75">
          Reset financial data
        </h3>

        <p className="mt-2 text-xs leading-5 text-white/30">
          Deletes {data.dataCounts.accounts} accounts,{" "}
          {data.dataCounts.transactions} transactions,{" "}
          {data.dataCounts.loanProfiles} loan profiles, and{" "}
          {data.dataCounts.financialGoals} goals.
        </p>

        <p className="mt-2 text-xs leading-5 text-white/25">
          Your login, preferences, and AI usage metadata remain.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          name="confirmation"
          placeholder="RESET FINSIGHT"
          autoComplete="off"
          className="border-red-400/20 bg-red-400/[0.035] text-white placeholder:text-white/20"
        />

        <ActionMessage state={state} />

        <DangerSubmitButton
          label="Reset financial data"
          pendingLabel="Resetting FinSight..."
        />
      </div>
    </form>
  );
}

function DeleteAccountPanel({
  requiresPassword,
}: {
  requiresPassword: boolean;
}) {
  const [confirmation, setConfirmation] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
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

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

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
    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px]">
      <div>
        <h3 className="text-sm font-medium text-red-200">
          Permanently delete account
        </h3>

        <p className="mt-2 text-xs leading-5 text-white/30">
          Deletes your Supabase authentication user and all FinSight rows
          attached through cascading user ownership.
        </p>

        <p className="mt-2 text-xs font-medium text-red-200/65">
          This cannot be reversed.
        </p>
      </div>

      <div className="space-y-3">
        {requiresPassword && (
          <Input
            type="password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
            }}
            placeholder="Current password"
            autoComplete="current-password"
            className="border-red-400/20 bg-red-400/[0.035] text-white"
          />
        )}

        <Input
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
          }}
          placeholder="DELETE MY ACCOUNT"
          autoComplete="off"
          className="border-red-400/20 bg-red-400/[0.035] text-white placeholder:text-white/20"
        />

        {error && <p className="text-xs text-red-300">{error}</p>}

        <Button
          type="button"
          variant="outline"
          disabled={
            deleting ||
            confirmation !== "DELETE MY ACCOUNT" ||
            (requiresPassword && currentPassword.length === 0)
          }
          onClick={() => {
            void deleteAccount();
          }}
          className="w-full border-red-400/25 bg-red-400/[0.06] text-red-200 hover:bg-red-400/15 hover:text-red-100"
        >
          {deleting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}

          {deleting ? "Deleting account..." : "Delete account permanently"}
        </Button>
      </div>
    </div>
  );
}

function DangerSubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="w-full border-red-400/25 bg-red-400/[0.06] text-red-200 hover:bg-red-400/15 hover:text-red-100"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}

      {pending ? pendingLabel : label}
    </Button>
  );
}

function ActionMessage({
  state,
}: {
  state: {
    status: string;
    message?: string;
  };
}) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={
        state.status === "success"
          ? "text-xs text-emerald-300"
          : "text-xs text-red-300"
      }
    >
      {state.message}
    </p>
  );
}
