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
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          Privacy and data controls
        </div>

        <h1 className="page-title">Settings</h1>

        <p className="page-description">
          Manage your FinSight profile, financial preferences, AI privacy,
          exports, and account data.
        </p>
      </header>

      <section
        aria-label="Profile and financial preferences"
        className="grid gap-6 xl:grid-cols-2"
      >
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
    <section
      aria-labelledby="account-information-heading"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Settings2 aria-hidden="true" className="size-4 text-violet-300" />

          <h2 id="account-information-heading" className="section-title">
            Account information
          </h2>
        </div>

        <p className="section-description">
          Authentication and account metadata associated with your FinSight
          profile.
        </p>
      </header>

      <dl className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
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
          dateTime={data.accountCreatedAt}
        />

        <InfoBlock
          label="Last sign-in"
          value={
            data.lastSignInAt
              ? formatTimestamp(data.lastSignInAt, data.preferences.timezone)
              : "Unavailable"
          }
          dateTime={data.lastSignInAt}
        />
      </dl>
    </section>
  );
}

function InfoBlock({
  label,
  value,
  mono = false,
  dateTime,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dateTime?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <dt className="text-xs font-medium text-white/30">{label}</dt>

      <dd
        className={
          mono
            ? "mt-2 truncate font-mono text-xs text-white/58"
            : "mt-2 truncate text-sm font-medium text-white/62"
        }
        title={value}
      >
        {dateTime ? <time dateTime={dateTime}>{value}</time> : value}
      </dd>
    </div>
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
