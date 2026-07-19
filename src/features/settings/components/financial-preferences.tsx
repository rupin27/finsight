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
import { Clock3, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { updateFinancialPreferences } from "@/app/(dashboard)/settings/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import { INITIAL_SETTINGS_ACTION_STATE } from "@/features/settings/settings-action-state";
import {
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_TIME_ZONES,
  type SettingsPageData,
  type SupportedDateFormat,
  type SupportedTimeZone,
} from "@/features/settings/settings.types";
import { cn } from "@/lib/utils";

interface FinancialPreferencesProps {
  data: SettingsPageData;
}

export function FinancialPreferences({ data }: FinancialPreferencesProps) {
  const router = useRouter();

  const idPrefix = useId();

  const statusId = `${idPrefix}-status`;

  const ids = {
    currency: `${idPrefix}-currency`,

    timezone: `${idPrefix}-timezone`,

    dateFormat: `${idPrefix}-date-format`,
  };

  const [defaultCurrency, setDefaultCurrency] = useState<AccountCurrency>(
    data.preferences.defaultCurrency,
  );

  const [timezone, setTimezone] = useState<SupportedTimeZone>(
    data.preferences.timezone,
  );

  const [dateFormat, setDateFormat] = useState<SupportedDateFormat>(
    data.preferences.dateFormat,
  );

  const [state, action] = useActionState(
    updateFinancialPreferences,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  const dirty =
    defaultCurrency !== data.preferences.defaultCurrency ||
    timezone !== data.preferences.timezone ||
    dateFormat !== data.preferences.dateFormat;

  useEffect(() => {
    setDefaultCurrency(data.preferences.defaultCurrency);

    setTimezone(data.preferences.timezone);

    setDateFormat(data.preferences.dateFormat);
  }, [
    data.preferences.dateFormat,
    data.preferences.defaultCurrency,
    data.preferences.timezone,
  ]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Financial preferences saved.");

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
          <Clock3 aria-hidden="true" className="size-4 text-violet-300" />

          <h2 id={`${idPrefix}-heading`} className="section-title">
            Financial preferences
          </h2>
        </div>

        <p className="section-description">
          Control currency, timezone, and date presentation.
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

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id={ids.currency}
            name="defaultCurrency"
            label="Display currency"
            description="Used for converted totals across dashboards."
            value={defaultCurrency}
            error={state.fieldErrors?.defaultCurrency?.[0]}
            onChange={(value) => {
              setDefaultCurrency(value as AccountCurrency);
            }}
          >
            {ACCOUNT_CURRENCIES.map((currency) => (
              <option key={currency} value={currency} className="bg-[#0b0f17]">
                {currency}
              </option>
            ))}
          </SelectField>

          <SelectField
            id={ids.timezone}
            name="timezone"
            label="Timezone"
            description="Used for account timestamps and usage history."
            value={timezone}
            error={state.fieldErrors?.timezone?.[0]}
            onChange={(value) => {
              setTimezone(value as SupportedTimeZone);
            }}
          >
            {SUPPORTED_TIME_ZONES.map((zone) => (
              <option key={zone} value={zone} className="bg-[#0b0f17]">
                {getTimezoneLabel(zone)}
              </option>
            ))}
          </SelectField>

          <SelectField
            id={ids.dateFormat}
            name="dateFormat"
            label="Date format"
            description="Controls how transaction and planning dates are presented."
            value={dateFormat}
            error={state.fieldErrors?.dateFormat?.[0]}
            onChange={(value) => {
              setDateFormat(value as SupportedDateFormat);
            }}
            className="sm:col-span-2"
          >
            {SUPPORTED_DATE_FORMATS.map((format) => (
              <option key={format} value={format} className="bg-[#0b0f17]">
                {format}
                {" · "}
                {formatDateExample(format)}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="flex justify-end">
          <SubmitButton disabled={!dirty} />
        </div>
      </form>
    </section>
  );
}

function SelectField({
  id,
  name,
  label,
  description,
  value,
  error,
  className,
  onChange,
  children,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  value: string;
  error?: string;
  className?: string;

  onChange: (value: string) => void;

  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>

      <p id={`${id}-description`} className="text-xs leading-5 text-white/32">
        {description}
      </p>

      <select
        id={id}
        name={name}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={[`${id}-description`, error ? `${id}-error` : null]
          .filter(Boolean)
          .join(" ")}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={selectClassName}
      >
        {children}
      </select>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs leading-5 text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
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
  "aria-invalid:border-red-400/45",
  "aria-invalid:ring-2",
  "aria-invalid:ring-red-400/15",
].join(" ");
