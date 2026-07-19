"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Bot, Check, Database, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { updateAiPreferences } from "@/app/(dashboard)/settings/actions";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { INITIAL_SETTINGS_ACTION_STATE } from "@/features/settings/settings-action-state";
import type { SettingsPageData } from "@/features/settings/settings.types";

interface AiPrivacySettingsProps {
  data: SettingsPageData;
}

export function AiPrivacySettings({ data }: AiPrivacySettingsProps) {
  const router = useRouter();

  const idPrefix = useId();

  const toggleId = `${idPrefix}-enabled`;

  const toggleDescriptionId = `${toggleId}-description`;

  const statusId = `${idPrefix}-status`;

  const [enabled, setEnabled] = useState(data.preferences.aiEnabled);

  const [state, action] = useActionState(
    updateAiPreferences,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  const dirty =
    enabled !== data.preferences.aiEnabled ||
    (enabled
      ? data.preferences.aiContextMode !== "aggregated"
      : data.preferences.aiContextMode !== "disabled");

  const usagePercentage =
    data.aiDailyLimit > 0
      ? Math.min(100, (data.aiRequestsLast24Hours / data.aiDailyLimit) * 100)
      : 0;

  useEffect(() => {
    setEnabled(data.preferences.aiEnabled);
  }, [data.preferences.aiEnabled]);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "AI preferences saved.");

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
          <Bot aria-hidden="true" className="size-4 text-violet-300" />

          <h2 id={`${idPrefix}-heading`} className="section-title">
            AI and privacy
          </h2>
        </div>

        <p className="section-description">
          Control whether FinSight may send aggregated financial context to
          OpenAI.
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

        <input
          type="hidden"
          name="aiContextMode"
          value={enabled ? "aggregated" : "disabled"}
        />

        <label
          htmlFor={toggleId}
          className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/[0.07] bg-black/10 p-4 transition-colors hover:bg-white/[0.025]"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white/72">
              Enable Ask FinSight
            </span>

            <span
              id={toggleDescriptionId}
              className="mt-1 block text-xs leading-5 text-white/32"
            >
              When disabled, deterministic insights remain available but
              external AI requests are blocked.
            </span>
          </span>

          <span className="relative mt-0.5 shrink-0">
            <input
              id={toggleId}
              type="checkbox"
              role="switch"
              name="aiEnabled"
              checked={enabled}
              aria-checked={enabled}
              aria-describedby={toggleDescriptionId}
              onChange={(event) => {
                setEnabled(event.target.checked);
              }}
              className="peer sr-only"
            />

            <span className="block h-7 w-12 rounded-full border border-white/10 bg-white/[0.08] transition-colors peer-checked:border-cyan-300/30 peer-checked:bg-cyan-300 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300/25" />

            <span className="absolute left-1 top-1 flex size-5 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm transition-transform peer-checked:translate-x-5">
              {enabled && <Check aria-hidden="true" className="size-3" />}
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <PrivacyCard
            icon={ShieldCheck}
            title="Sent to OpenAI"
            items={[
              "Aggregated balances",
              "Monthly income and outflow",
              "Savings and debt ratios",
              "Goal and projection summaries",
              "Calculated loan opportunity",
            ]}
          />

          <PrivacyCard
            icon={Database}
            title="Not sent to OpenAI"
            items={[
              "Passwords or API keys",
              "Bank credentials",
              "Full account numbers",
              "Transaction notes",
              "Merchant names",
            ]}
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-white/30">
                Requests in the last 24 hours
              </p>

              <p className="financial-number mt-1 text-lg font-semibold text-white">
                {data.aiRequestsLast24Hours}
                {" / "}
                {data.aiDailyLimit}
              </p>
            </div>

            <p className="max-w-sm text-xs leading-5 text-white/28">
              Failed requests are excluded from the application limit.
            </p>
          </div>

          <Progress
            value={usagePercentage}
            aria-label="AI daily request usage"
            aria-valuetext={`${data.aiRequestsLast24Hours} of ${data.aiDailyLimit} requests used`}
            className="mt-4"
          />
        </div>

        <div className="flex justify-end">
          <AiSubmitButton disabled={!dirty} />
        </div>
      </form>
    </section>
  );
}

function PrivacyCard({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof ShieldCheck;
  title: string;
  items: string[];
}) {
  return (
    <article className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className="size-4 text-cyan-300" />

        <h3 className="text-sm font-semibold text-white/65">{title}</h3>
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-xs leading-5 text-white/32"
          >
            <Check
              aria-hidden="true"
              className="mt-1 size-3 shrink-0 text-cyan-300/75"
            />

            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function AiSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? "Saving AI preferences..." : "Save AI preferences"}
    </Button>
  );
}
