"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Clock3, LoaderCircle } from "lucide-react";

import { updateFinancialPreferences } from "@/app/(dashboard)/settings/actions";
import { ACCOUNT_CURRENCIES } from "@/features/accounts/account.types";
import { INITIAL_SETTINGS_ACTION_STATE } from "@/features/settings/settings-action-state";
import {
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_TIME_ZONES,
  type SettingsPageData,
} from "@/features/settings/settings.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface FinancialPreferencesProps {
  data: SettingsPageData;
}

export function FinancialPreferences({ data }: FinancialPreferencesProps) {
  const [state, action] = useActionState(
    updateFinancialPreferences,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-violet-300" />

          <h2 className="font-medium text-white">Financial preferences</h2>
        </div>

        <p className="mt-2 text-sm text-white/35">
          Control currency, timezone, and date presentation.
        </p>
      </header>

      <form action={action} className="space-y-5 p-5">
        {state.message && (
          <div
            className={
              state.status === "success" ? successClassName : errorClassName
            }
          >
            {state.message}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="defaultCurrency"
            name="defaultCurrency"
            label="Display currency"
            defaultValue={data.preferences.defaultCurrency}
          >
            {ACCOUNT_CURRENCIES.map((currency) => (
              <option key={currency} value={currency} className="bg-[#0b0f17]">
                {currency}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="timezone"
            name="timezone"
            label="Timezone"
            defaultValue={data.preferences.timezone}
          >
            {SUPPORTED_TIME_ZONES.map((timezone) => (
              <option key={timezone} value={timezone} className="bg-[#0b0f17]">
                {getTimezoneLabel(timezone)}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="dateFormat"
            name="dateFormat"
            label="Date format"
            defaultValue={data.preferences.dateFormat}
            className="sm:col-span-2"
          >
            {SUPPORTED_DATE_FORMATS.map((format) => (
              <option key={format} value={format} className="bg-[#0b0f17]">
                {format} · {formatDateExample(format)}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </section>
  );
}

function SelectField({
  id,
  name,
  label,
  defaultValue,
  className,
  children,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id} className="text-white/65">
        {label}
      </Label>

      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40"
      >
        {children}
      </select>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? "Saving preferences..." : "Save preferences"}
    </Button>
  );
}

function getTimezoneLabel(timezone: string): string {
  const labels: Record<string, string> = {
    UTC: "UTC",
    "Asia/Kolkata": "India · Asia/Kolkata",
    "Europe/Dublin": "Ireland · Europe/Dublin",
    "America/New_York": "US Eastern · New York",
    "America/Chicago": "US Central · Chicago",
    "America/Denver": "US Mountain · Denver",
    "America/Los_Angeles": "US Pacific · Los Angeles",
  };

  return labels[timezone] ?? timezone;
}

function formatDateExample(format: string): string {
  const examples: Record<string, string> = {
    "MMM d, yyyy": "Jul 18, 2026",

    "d MMM yyyy": "18 Jul 2026",

    "dd/MM/yyyy": "18/07/2026",

    "MM/dd/yyyy": "07/18/2026",

    "yyyy-MM-dd": "2026-07-18",
  };

  return examples[format] ?? format;
}

const successClassName =
  "rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200";

const errorClassName =
  "rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200";
