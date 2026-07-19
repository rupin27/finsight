import { Download, FileJson, FileSpreadsheet } from "lucide-react";

import type { SettingsPageData } from "@/features/settings/settings.types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataExportPanelProps {
  data: SettingsPageData;
}

export function DataExportPanel({ data }: DataExportPanelProps) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Download className="size-4 text-cyan-300" />

          <h2 className="font-medium text-white">Export your data</h2>
        </div>

        <p className="mt-2 text-sm text-white/35">
          Download a portable copy of your FinSight data.
        </p>
      </header>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <ExportCard
          icon={FileJson}
          title="Complete JSON export"
          description="Preferences, accounts, transactions, loans, goals, and AI usage metadata."
          href="/api/data-export"
          label="Download JSON"
        />

        <ExportCard
          icon={FileSpreadsheet}
          title="Transaction CSV"
          description={`${data.dataCounts.transactions} transactions in a spreadsheet-compatible format.`}
          href="/api/data-export/transactions"
          label="Download CSV"
        />
      </div>
    </section>
  );
}

function ExportCard({
  icon: Icon,
  title,
  description,
  href,
  label,
}: {
  icon: typeof FileJson;
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <article className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
        <Icon className="size-[18px]" />
      </div>

      <h3 className="mt-4 text-sm font-medium text-white/70">{title}</h3>

      <p className="mt-2 min-h-10 text-xs leading-5 text-white/30">
        {description}
      </p>

      <a
        href={href}
        className={cn(
          buttonVariants({
            variant: "outline",
            size: "sm",
          }),
          "mt-4 border-white/10 bg-transparent text-white/55 hover:bg-white/[0.06]",
        )}
      >
        <Download className="size-3.5" />
        {label}
      </a>
    </article>
  );
}
