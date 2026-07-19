import { Download, FileJson, FileSpreadsheet, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { SettingsPageData } from "@/features/settings/settings.types";
import { cn } from "@/lib/utils";

interface DataExportPanelProps {
  data: SettingsPageData;
}

export function DataExportPanel({ data }: DataExportPanelProps) {
  return (
    <section
      aria-labelledby="data-export-heading"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Download aria-hidden="true" className="size-4 text-cyan-300" />

          <h2 id="data-export-heading" className="section-title">
            Export your data
          </h2>
        </div>

        <p className="section-description">
          Download a portable copy of your FinSight records.
        </p>
      </header>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <ExportCard
          icon={FileJson}
          title="Complete JSON export"
          description="Preferences, accounts, transactions, loans, goals, and AI usage metadata."
          metadata={`${data.dataCounts.accounts} accounts · ${data.dataCounts.financialGoals} goals`}
          href="/api/data-export"
          label="Download JSON"
        />

        <ExportCard
          icon={FileSpreadsheet}
          title="Transaction CSV"
          description="A spreadsheet-compatible export containing your recorded transactions."
          metadata={`${data.dataCounts.transactions} transactions`}
          href="/api/data-export/transactions"
          label="Download CSV"
        />
      </div>

      <div className="flex items-start gap-3 border-t border-white/[0.06] bg-black/10 px-5 py-4">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-emerald-300"
        />

        <p className="text-xs leading-5 text-white/32">
          Exports are generated on demand for your authenticated account. Your
          password and authentication secrets are never included.
        </p>
      </div>
    </section>
  );
}

function ExportCard({
  icon: Icon,
  title,
  description,
  metadata,
  href,
  label,
}: {
  icon: typeof FileJson;
  title: string;
  description: string;
  metadata: string;
  href: string;
  label: string;
}) {
  return (
    <article className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <div
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300"
      >
        <Icon className="size-[18px]" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-white/70">{title}</h3>

      <p className="mt-2 min-h-10 text-xs leading-5 text-white/32">
        {description}
      </p>

      <p className="financial-number mt-3 text-xs font-medium text-white/28">
        {metadata}
      </p>

      <a
        href={href}
        download
        aria-label={`${label}: ${title}`}
        className={cn(
          buttonVariants({
            variant: "outline",
            size: "sm",
          }),

          "mt-4 border-white/10 bg-transparent text-white/58 hover:bg-white/[0.06]",
        )}
      >
        <Download aria-hidden="true" className="size-3.5" />

        {label}
      </a>
    </article>
  );
}
