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
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] px-5 py-4">
        <h2 className="font-medium text-white">Recent CSV imports</h2>

        <p className="mt-1 text-xs text-white/30">
          FinSight stores the import result, not the original CSV file.
        </p>
      </header>

      <div className="divide-y divide-white/[0.055]">
        {imports.map((csvImport) => {
          const succeeded = csvImport.status === "completed";

          return (
            <article
              key={csvImport.id}
              className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    succeeded
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-red-400/10 text-red-300",
                  )}
                >
                  {succeeded ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-3.5 text-white/25" />

                    <p className="truncate text-sm font-medium text-white/65">
                      {csvImport.filename}
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-white/30">
                    {csvImport.accountId
                      ? (accountMap.get(csvImport.accountId) ??
                        "Deleted account")
                      : "Deleted account"}
                    {" · "}
                    {formatImportDate(csvImport.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
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
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
      <p className="text-white/25">{label}</p>

      <p className={cn("mt-1 font-medium", className)}>{value}</p>
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
