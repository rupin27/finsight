import { CheckCircle2, FileSpreadsheet, XCircle } from "lucide-react";

import type { Account } from "@/features/accounts/account.types";
import type { CsvImportRecord } from "@/features/transactions/csv-import.types";
import { cn } from "@/lib/utils";

interface CsvImportHistoryProps {
  imports: CsvImportRecord[];
  accounts: Account[];
}

export function CsvImportHistory({ imports, accounts }: CsvImportHistoryProps) {
  if (imports.length === 0) {
    return null;
  }

  const accountMap = new Map(
    accounts.map((account) => [account.id, account.name]),
  );

  return (
    <section
      aria-labelledby="csv-import-history-heading"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] px-5 py-4">
        <h2 id="csv-import-history-heading" className="section-title">
          Recent CSV imports
        </h2>

        <p className="section-description">
          FinSight stores the import result, but does not retain the original
          CSV file.
        </p>
      </header>

      <div role="list" className="divide-y divide-white/[0.055]">
        {imports.map((csvImport) => {
          const succeeded = csvImport.status === "completed";

          const accountName = csvImport.accountId
            ? (accountMap.get(csvImport.accountId) ?? "Deleted account")
            : "Deleted account";

          return (
            <article
              key={csvImport.id}
              role="listitem"
              aria-label={`${csvImport.filename}, ${
                succeeded ? "completed" : "failed"
              } import`}
              className="px-5 py-4 transition-colors hover:bg-white/[0.018]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl border",

                      succeeded
                        ? "border-emerald-400/10 bg-emerald-400/10 text-emerald-300"
                        : "border-red-400/10 bg-red-400/10 text-red-300",
                    )}
                  >
                    {succeeded ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <XCircle className="size-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <FileSpreadsheet
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-white/28"
                      />

                      <p
                        title={csvImport.filename}
                        className="max-w-full truncate text-sm font-semibold text-white/68"
                      >
                        {csvImport.filename}
                      </p>

                      <ImportStatusBadge succeeded={succeeded} />
                    </div>

                    <p className="mt-1 text-xs leading-5 text-white/32">
                      {accountName}
                      {" · "}

                      <time dateTime={csvImport.createdAt}>
                        {formatImportDate(csvImport.createdAt)}
                      </time>

                      {" · "}

                      {formatFileSize(csvImport.fileSizeBytes)}
                    </p>

                    {!succeeded && csvImport.errorMessage && (
                      <p className="mt-2 max-w-2xl text-xs leading-5 text-red-300/80">
                        {csvImport.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
                  <ImportCount
                    label="Total"
                    value={csvImport.totalRows}
                    className="text-white/65"
                  />

                  <ImportCount
                    label="Imported"
                    value={csvImport.importedRows}
                    className="text-emerald-300"
                  />

                  <ImportCount
                    label="Duplicates"
                    value={csvImport.duplicateRows}
                    className="text-amber-300"
                  />

                  <ImportCount
                    label="Invalid"
                    value={csvImport.invalidRows}
                    className="text-red-300"
                  />
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ImportStatusBadge({ succeeded }: { succeeded: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold",

        succeeded
          ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
          : "border-red-400/20 bg-red-400/[0.07] text-red-200",
      )}
    >
      {succeeded ? "Completed" : "Failed"}
    </span>
  );
}

function ImportCount({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div>
      <dt className="text-white/28">{label}</dt>

      <dd className={cn("financial-number mt-1 font-semibold", className)}>
        {value}
      </dd>
    </div>
  );
}

function formatImportDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
