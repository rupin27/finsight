import { Settings2, ShieldCheck } from "lucide-react";

import { AiPrivacySettings } from "@/features/settings/components/ai-privacy-settings";
import { AiUsageHistory } from "@/features/settings/components/ai-usage-history";
import { DangerZone } from "@/features/settings/components/danger-zone";
import { DataExportPanel } from "@/features/settings/components/data-export-panel";
import { FinancialPreferences } from "@/features/settings/components/financial-preferences";
import { ProfileSettings } from "@/features/settings/components/profile-settings";
import { getSettingsPageData } from "@/features/settings/settings-data";

export default async function SettingsPage() {
  const data = await getSettingsPageData();

  return (
    <div className="space-y-8">
      <header>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-200">
          <ShieldCheck className="size-3.5" />
          Privacy and data controls
        </div>

        <h1 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40 sm:text-base">
          Manage your FinSight profile, financial preferences, AI privacy,
          exports, and account data.
        </p>
      </header>

      <section className="grid gap-6 xl:grid-cols-2">
        <ProfileSettings data={data} />

        <FinancialPreferences data={data} />
      </section>

      <AiPrivacySettings data={data} />

      <AiUsageHistory
        events={data.aiUsage}
        timezone={data.preferences.timezone}
      />

      <DataExportPanel data={data} />

      <AccountInformation data={data} />

      <DangerZone data={data} />
    </div>
  );
}

function AccountInformation({
  data,
}: {
  data: Awaited<ReturnType<typeof getSettingsPageData>>;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-violet-300" />

          <h2 className="font-medium text-white">Account information</h2>
        </div>
      </header>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <InfoBlock label="User ID" value={data.userId} mono />

        <InfoBlock
          label="Authentication"
          value={
            data.authProviders.length > 0
              ? data.authProviders.join(", ")
              : "Unknown"
          }
        />

        <InfoBlock
          label="Account created"
          value={
            data.accountCreatedAt
              ? formatTimestamp(
                  data.accountCreatedAt,
                  data.preferences.timezone,
                )
              : "Unavailable"
          }
        />

        <InfoBlock
          label="Last sign-in"
          value={
            data.lastSignInAt
              ? formatTimestamp(data.lastSignInAt, data.preferences.timezone)
              : "Unavailable"
          }
        />
      </div>
    </section>
  );
}

function InfoBlock({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <p className="text-xs text-white/30">{label}</p>

      <p
        className={
          mono
            ? "mt-2 truncate font-mono text-xs text-white/55"
            : "mt-2 truncate text-sm text-white/60"
        }
        title={value}
      >
        {value}
      </p>
    </article>
  );
}

function formatTimestamp(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}
