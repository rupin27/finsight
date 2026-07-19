"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, UserRound } from "lucide-react";

import { updateProfileSettings } from "@/app/(dashboard)/settings/actions";
import { INITIAL_SETTINGS_ACTION_STATE } from "@/features/settings/settings-action-state";
import type { SettingsPageData } from "@/features/settings/settings.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileSettingsProps {
  data: SettingsPageData;
}

export function ProfileSettings({ data }: ProfileSettingsProps) {
  const [state, action] = useActionState(
    updateProfileSettings,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  const [fullName, setFullName] = useState(data.preferences.fullName ?? "");

  /*
   * Keep the controlled field synchronized
   * when the server revalidates the settings
   * page and sends updated preferences.
   */
  useEffect(() => {
    setFullName(data.preferences.fullName ?? "");
  }, [data.preferences.fullName]);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <UserRound className="size-4 text-cyan-300" />

          <h2 className="font-medium text-white">Profile</h2>
        </div>

        <p className="mt-2 text-sm text-white/35">
          Manage the name shown throughout FinSight.
        </p>
      </header>

      <form action={action} className="space-y-5 p-5">
        <SettingsMessage state={state} />

        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-white/65">
            Full name
          </Label>

          <Input
            id="fullName"
            name="fullName"
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
            }}
            placeholder="Your name"
            autoComplete="name"
            required
            className="border-white/10 bg-white/[0.04] text-white"
          />

          {state.fieldErrors?.fullName?.[0] && (
            <p className="text-xs text-red-300">
              {state.fieldErrors.fullName[0]}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
          <p className="text-xs text-white/30">Sign-in email</p>

          <p className="mt-1 text-sm text-white/60">{data.email}</p>
        </div>

        <div className="flex justify-end">
          <SettingsSubmitButton
            label="Save profile"
            pendingLabel="Saving profile..."
          />
        </div>
      </form>
    </section>
  );
}

function SettingsMessage({
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
    <div
      className={
        state.status === "success"
          ? "rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
          : "rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
      }
    >
      {state.message}
    </div>
  );
}

function SettingsSubmitButton({
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
      disabled={pending}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? pendingLabel : label}
    </Button>
  );
}
