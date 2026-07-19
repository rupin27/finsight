"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { LoaderCircle, UserRound } from "lucide-react";
import { toast } from "sonner";

import { updateProfileSettings } from "@/app/(dashboard)/settings/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_SETTINGS_ACTION_STATE } from "@/features/settings/settings-action-state";
import type { SettingsPageData } from "@/features/settings/settings.types";

interface ProfileSettingsProps {
  data: SettingsPageData;
}

export function ProfileSettings({ data }: ProfileSettingsProps) {
  const router = useRouter();

  const idPrefix = useId();

  const fullNameId = `${idPrefix}-full-name`;

  const statusId = `${idPrefix}-status`;

  const initialFullName = data.preferences.fullName ?? "";

  const [fullName, setFullName] = useState(initialFullName);

  const [state, action] = useActionState(
    updateProfileSettings,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  const fieldError = state.fieldErrors?.fullName?.[0];

  const dirty = fullName !== initialFullName;

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile settings saved.");

      router.refresh();
    }
  }, [router, state.message, state.status]);

  return (
    <section
      aria-labelledby={`${idPrefix}-heading`}
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <UserRound aria-hidden="true" className="size-4 text-cyan-300" />

          <h2 id={`${idPrefix}-heading`} className="section-title">
            Profile
          </h2>
        </div>

        <p className="section-description">
          Manage the name shown throughout FinSight.
        </p>
      </header>

      <form
        action={action}
        aria-describedby={state.message ? statusId : undefined}
        className="space-y-5 p-5"
      >
        <FormStatusMessage
          id={statusId}
          status={state.status}
          message={state.message}
        />

        <div className="space-y-2">
          <Label htmlFor={fullNameId}>Full name</Label>

          <p
            id={`${fullNameId}-description`}
            className="text-xs leading-5 text-white/32"
          >
            Used for account greetings and personalized interface text.
          </p>

          <Input
            id={fullNameId}
            name="fullName"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
            }}
            placeholder="Your name"
            autoComplete="name"
            required
            aria-invalid={Boolean(fieldError)}
            aria-describedby={[
              `${fullNameId}-description`,

              fieldError ? `${fullNameId}-error` : null,
            ]
              .filter(Boolean)
              .join(" ")}
          />

          {fieldError && (
            <p
              id={`${fullNameId}-error`}
              role="alert"
              className="text-xs leading-5 text-red-300"
            >
              {fieldError}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
          <p className="text-xs font-medium text-white/30">Sign-in email</p>

          <p className="mt-1 break-all text-sm font-medium text-white/62">
            {data.email}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/28">
            Authentication email changes are managed through your identity
            provider.
          </p>
        </div>

        <div className="flex justify-end">
          <SettingsSubmitButton
            label="Save profile"
            pendingLabel="Saving profile..."
            disabled={!dirty}
          />
        </div>
      </form>
    </section>
  );
}

function SettingsSubmitButton({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? pendingLabel : label}
    </Button>
  );
}
