"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Bot, Database, LoaderCircle, ShieldCheck } from "lucide-react";

import { updateAiPreferences } from "@/app/(dashboard)/settings/actions";
import { INITIAL_SETTINGS_ACTION_STATE } from "@/features/settings/settings-action-state";
import type { SettingsPageData } from "@/features/settings/settings.types";
import { Button } from "@/components/ui/button";

interface AiPrivacySettingsProps {
  data: SettingsPageData;
}

export function AiPrivacySettings({ data }: AiPrivacySettingsProps) {
  const [state, action] = useActionState(
    updateAiPreferences,
    INITIAL_SETTINGS_ACTION_STATE,
  );

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-violet-300" />

          <h2 className="font-medium text-white">AI and privacy</h2>
        </div>

        <p className="mt-2 text-sm text-white/35">
          Control whether FinSight may send aggregated financial context to
          OpenAI.
        </p>
      </header>

      <form action={action} className="space-y-5 p-5">
        {state.message && (
          <div
            className={
              state.status === "success"
                ? "rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
                : "rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            }
          >
            {state.message}
          </div>
        )}

        <label className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-4">
          <input
            type="checkbox"
            name="aiEnabled"
            defaultChecked={data.preferences.aiEnabled}
            className="mt-1 size-4 accent-cyan-300"
          />

          <span>
            <span className="block text-sm font-medium text-white/70">
              Enable Ask FinSight
            </span>

            <span className="mt-1 block text-xs leading-5 text-white/30">
              When disabled, deterministic insights remain available but OpenAI
              requests are blocked.
            </span>
          </span>
        </label>

        <input
          type="hidden"
          name="aiContextMode"
          value={
            data.preferences.aiContextMode === "disabled"
              ? "disabled"
              : "aggregated"
          }
        />

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-white/30">
                Requests in the last 24 hours
              </p>

              <p className="mt-1 text-lg font-medium text-white">
                {data.aiRequestsLast24Hours}
                {" / "}
                {data.aiDailyLimit}
              </p>
            </div>

            <p className="text-xs text-white/25">
              Failed requests are excluded from the application limit.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <AiSubmitButton />
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
        <Icon className="size-4 text-cyan-300" />

        <h3 className="text-sm font-medium text-white/65">{title}</h3>
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-xs text-white/30">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function AiSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
    >
      {pending && <LoaderCircle className="size-4 animate-spin" />}

      {pending ? "Saving AI preferences..." : "Save AI preferences"}
    </Button>
  );
}
