"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
} from "lucide-react";

import type { Account } from "@/features/accounts/account.types";
import type {
  CsvColumnMapping,
  CsvImportApiResponse,
  CsvPreparedRow,
  CsvRawRow,
} from "@/features/transactions/csv-import.types";
import {
  inferCsvMapping,
  prepareCsvRows,
} from "@/features/transactions/csv-import-utils";
import type { TransactionCategory } from "@/features/transactions/transaction.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MAX_ROWS = 500;

type WizardStep = "upload" | "mapping" | "preview" | "complete";

interface CsvImportDialogProps {
  accounts: Account[];
  categories: TransactionCategory[];
}

export function CsvImportDialog({
  accounts,
  categories,
}: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);

  const canImport = accounts.some(
    (account) => account.isActive && account.accountType !== "loan",
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={!canImport}
            className="border-white/10 bg-white/[0.035] text-white/65 hover:bg-white/[0.07] hover:text-white"
          />
        }
      >
        <Upload className="size-4" />
        Import CSV
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#0b0f17] text-white sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Import transactions</DialogTitle>

          <DialogDescription className="text-white/40">
            Map your CSV columns, preview the results, and import valid
            transactions.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CsvImportWizard accounts={accounts} categories={categories} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CsvImportWizardProps {
  accounts: Account[];
  categories: TransactionCategory[];
}

function CsvImportWizard({ accounts, categories }: CsvImportWizardProps) {
  const router = useRouter();

  const sourceAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.isActive && account.accountType !== "loan",
      ),
    [accounts],
  );

  const incomeCategories = categories.filter(
    (category) => category.kind === "income",
  );

  const expenseCategories = categories.filter(
    (category) => category.kind === "expense",
  );

  const [step, setStep] = useState<WizardStep>("upload");

  const [file, setFile] = useState<File | null>(null);

  const [headers, setHeaders] = useState<string[]>([]);

  const [rawRows, setRawRows] = useState<CsvRawRow[]>([]);

  const [mapping, setMapping] = useState<CsvColumnMapping | null>(null);

  const [accountId, setAccountId] = useState(sourceAccounts[0]?.id ?? "");

  const [incomeFallbackCategoryId, setIncomeFallbackCategoryId] = useState(
    incomeCategories.find((category) => category.name === "Other Income")?.id ??
      incomeCategories[0]?.id ??
      "",
  );

  const [expenseFallbackCategoryId, setExpenseFallbackCategoryId] = useState(
    expenseCategories.find((category) => category.name === "Other Expense")
      ?.id ??
      expenseCategories[0]?.id ??
      "",
  );

  const [preparedRows, setPreparedRows] = useState<CsvPreparedRow[]>([]);

  const [response, setResponse] = useState<CsvImportApiResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const selectedAccount = sourceAccounts.find(
    (account) => account.id === accountId,
  );

  async function handleFile(selectedFile: File | undefined) {
    setError(null);
    setResponse(null);

    if (!selectedFile) {
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError("The CSV file cannot exceed 5 MB.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Select a file with the .csv extension.");
      return;
    }

    setLoading(true);

    try {
      const parsed = await parseCsvFile(selectedFile);

      if (parsed.rows.length > MAX_ROWS) {
        throw new Error(
          `This file contains ${parsed.rows.length} rows. Split it into files containing no more than ${MAX_ROWS} rows each.`,
        );
      }

      setFile(selectedFile);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(inferCsvMapping(parsed.headers));
      setStep("mapping");
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "The CSV file could not be parsed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function requestPreview() {
    if (!mapping || !file) {
      return;
    }

    const mappingError = validateMapping(mapping);

    if (mappingError) {
      setError(mappingError);
      return;
    }

    const rows = prepareCsvRows(rawRows, mapping);

    setPreparedRows(rows);

    const result = await submitImport("preview", rows);

    if (result?.success) {
      setStep("preview");
    }
  }

  async function commitImport() {
    const result = await submitImport("commit", preparedRows);

    if (result?.success) {
      setStep("complete");
      router.refresh();
    }
  }

  async function submitImport(
    mode: "preview" | "commit",
    rows: CsvPreparedRow[],
  ): Promise<CsvImportApiResponse | null> {
    if (!file) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const apiResponse = await fetch("/api/imports/csv-transactions", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          mode,
          filename: file.name,
          fileSizeBytes: file.size,
          accountId,
          incomeFallbackCategoryId,
          expenseFallbackCategoryId,
          rows,
        }),
      });

      const result = (await apiResponse.json()) as CsvImportApiResponse;

      setResponse(result);

      if (!apiResponse.ok || !result.success) {
        setError(result.error ?? "The CSV import failed.");

        return result;
      }

      return result;
    } catch {
      setError("FinSight could not reach the import service.");

      return null;
    } finally {
      setLoading(false);
    }
  }

  function resetWizard() {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setRawRows([]);
    setMapping(null);
    setPreparedRows([]);
    setResponse(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <WizardProgress step={step} />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === "upload" && (
        <UploadStep loading={loading} onFile={handleFile} />
      )}

      {step === "mapping" && mapping && file && (
        <MappingStep
          file={file}
          rowCount={rawRows.length}
          headers={headers}
          mapping={mapping}
          setMapping={setMapping}
          sourceAccounts={sourceAccounts}
          selectedAccountId={accountId}
          setSelectedAccountId={setAccountId}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          incomeFallbackCategoryId={incomeFallbackCategoryId}
          setIncomeFallbackCategoryId={setIncomeFallbackCategoryId}
          expenseFallbackCategoryId={expenseFallbackCategoryId}
          setExpenseFallbackCategoryId={setExpenseFallbackCategoryId}
          loading={loading}
          onBack={resetWizard}
          onPreview={requestPreview}
        />
      )}

      {step === "preview" && response?.summary && response.previewRows && (
        <PreviewStep
          response={response}
          currency={selectedAccount?.currency ?? "USD"}
          loading={loading}
          onBack={() => {
            setStep("mapping");
          }}
          onImport={commitImport}
        />
      )}

      {step === "complete" && response?.summary && (
        <CompleteStep response={response} onImportAnother={resetWizard} />
      )}
    </div>
  );
}

interface UploadStepProps {
  loading: boolean;
  onFile: (file: File | undefined) => void;
}

function UploadStep({ loading, onFile }: UploadStepProps) {
  return (
    <label className="flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center transition-colors hover:border-cyan-300/25 hover:bg-cyan-300/[0.025]">
      {loading ? (
        <LoaderCircle className="size-8 animate-spin text-cyan-300" />
      ) : (
        <FileSpreadsheet className="size-9 text-cyan-300" />
      )}

      <h3 className="mt-5 font-medium text-white">Select a CSV statement</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-white/35">
        The file is parsed locally before normalized transaction data is sent to
        FinSight.
      </p>

      <p className="mt-3 text-xs text-white/25">
        Maximum 5 MB and 500 data rows
      </p>

      <input
        type="file"
        accept=".csv,text/csv"
        disabled={loading}
        className="sr-only"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
        }}
      />
    </label>
  );
}

interface MappingStepProps {
  file: File;
  rowCount: number;

  headers: string[];

  mapping: CsvColumnMapping;

  setMapping: React.Dispatch<React.SetStateAction<CsvColumnMapping | null>>;

  sourceAccounts: Account[];

  selectedAccountId: string;
  setSelectedAccountId: (value: string) => void;

  incomeCategories: TransactionCategory[];
  expenseCategories: TransactionCategory[];

  incomeFallbackCategoryId: string;

  setIncomeFallbackCategoryId: (value: string) => void;

  expenseFallbackCategoryId: string;

  setExpenseFallbackCategoryId: (value: string) => void;

  loading: boolean;
  onBack: () => void;
  onPreview: () => void;
}

function MappingStep({
  file,
  rowCount,
  headers,
  mapping,
  setMapping,
  sourceAccounts,
  selectedAccountId,
  setSelectedAccountId,
  incomeCategories,
  expenseCategories,
  incomeFallbackCategoryId,
  setIncomeFallbackCategoryId,
  expenseFallbackCategoryId,
  setExpenseFallbackCategoryId,
  loading,
  onBack,
  onPreview,
}: MappingStepProps) {
  function updateMapping(update: Partial<CsvColumnMapping>) {
    setMapping((current) =>
      current
        ? {
            ...current,
            ...update,
          }
        : current,
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="font-medium text-white/75">{file.name}</p>

        <p className="mt-1 text-xs text-white/30">
          {formatFileSize(file.size)} · {rowCount} data rows
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <MappingField label="Import into">
          <select
            value={selectedAccountId}
            onChange={(event) => {
              setSelectedAccountId(event.target.value);
            }}
            className={selectClassName}
          >
            {sourceAccounts.map((account) => (
              <option
                key={account.id}
                value={account.id}
                className="bg-[#0b0f17]"
              >
                {account.name} · {account.currency}
              </option>
            ))}
          </select>
        </MappingField>

        <MappingField label="Date format">
          <select
            value={mapping.dateFormat}
            onChange={(event) => {
              updateMapping({
                dateFormat: event.target
                  .value as CsvColumnMapping["dateFormat"],
              });
            }}
            className={selectClassName}
          >
            <option value="yyyy-mm-dd" className="bg-[#0b0f17]">
              YYYY-MM-DD
            </option>

            <option value="mm/dd/yyyy" className="bg-[#0b0f17]">
              MM/DD/YYYY
            </option>

            <option value="dd/mm/yyyy" className="bg-[#0b0f17]">
              DD/MM/YYYY
            </option>
          </select>
        </MappingField>

        <MappingField label="Date column">
          <ColumnSelect
            headers={headers}
            value={mapping.dateColumn}
            required
            onChange={(value) => {
              updateMapping({
                dateColumn: value,
              });
            }}
          />
        </MappingField>

        <MappingField label="Description column">
          <ColumnSelect
            headers={headers}
            value={mapping.descriptionColumn}
            required
            onChange={(value) => {
              updateMapping({
                descriptionColumn: value,
              });
            }}
          />
        </MappingField>

        <MappingField label="Amount format">
          <select
            value={mapping.amountMode}
            onChange={(event) => {
              updateMapping({
                amountMode: event.target
                  .value as CsvColumnMapping["amountMode"],
              });
            }}
            className={selectClassName}
          >
            <option value="signed" className="bg-[#0b0f17]">
              One signed amount column
            </option>

            <option value="debit_credit" className="bg-[#0b0f17]">
              Separate debit and credit
            </option>
          </select>
        </MappingField>

        {mapping.amountMode === "signed" ? (
          <>
            <MappingField label="Amount column">
              <ColumnSelect
                headers={headers}
                value={mapping.amountColumn}
                required
                onChange={(value) => {
                  updateMapping({
                    amountColumn: value,
                  });
                }}
              />
            </MappingField>

            <MappingField label="Positive amounts mean">
              <select
                value={mapping.positiveMeaning}
                onChange={(event) => {
                  updateMapping({
                    positiveMeaning: event.target
                      .value as CsvColumnMapping["positiveMeaning"],
                  });
                }}
                className={selectClassName}
              >
                <option value="income" className="bg-[#0b0f17]">
                  Income
                </option>

                <option value="expense" className="bg-[#0b0f17]">
                  Expense
                </option>
              </select>
            </MappingField>
          </>
        ) : (
          <>
            <MappingField label="Debit column">
              <ColumnSelect
                headers={headers}
                value={mapping.debitColumn}
                required
                onChange={(value) => {
                  updateMapping({
                    debitColumn: value,
                  });
                }}
              />
            </MappingField>

            <MappingField label="Credit column">
              <ColumnSelect
                headers={headers}
                value={mapping.creditColumn}
                required
                onChange={(value) => {
                  updateMapping({
                    creditColumn: value,
                  });
                }}
              />
            </MappingField>
          </>
        )}

        <MappingField label="Merchant column">
          <ColumnSelect
            headers={headers}
            value={mapping.merchantColumn}
            onChange={(value) => {
              updateMapping({
                merchantColumn: value,
              });
            }}
          />
        </MappingField>

        <MappingField label="Category column">
          <ColumnSelect
            headers={headers}
            value={mapping.categoryColumn}
            onChange={(value) => {
              updateMapping({
                categoryColumn: value,
              });
            }}
          />
        </MappingField>

        <MappingField label="Notes column">
          <ColumnSelect
            headers={headers}
            value={mapping.notesColumn}
            onChange={(value) => {
              updateMapping({
                notesColumn: value,
              });
            }}
          />
        </MappingField>

        <div />

        <MappingField label="Fallback income category">
          <select
            value={incomeFallbackCategoryId}
            onChange={(event) => {
              setIncomeFallbackCategoryId(event.target.value);
            }}
            className={selectClassName}
          >
            {incomeCategories.map((category) => (
              <option
                key={category.id}
                value={category.id}
                className="bg-[#0b0f17]"
              >
                {category.name}
              </option>
            ))}
          </select>
        </MappingField>

        <MappingField label="Fallback expense category">
          <select
            value={expenseFallbackCategoryId}
            onChange={(event) => {
              setExpenseFallbackCategoryId(event.target.value);
            }}
            className={selectClassName}
          >
            {expenseCategories.map((category) => (
              <option
                key={category.id}
                value={category.id}
                className="bg-[#0b0f17]"
              >
                {category.name}
              </option>
            ))}
          </select>
        </MappingField>
      </div>

      <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3 text-xs leading-5 text-cyan-100/60">
        Category names are matched case-insensitively. Missing or unmatched
        categories use the selected fallback.
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-white/10 bg-transparent text-white/55"
        >
          <ArrowLeft className="size-4" />
          Choose another file
        </Button>

        <Button
          type="button"
          disabled={loading}
          onClick={onPreview}
          className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          Preview import
        </Button>
      </div>
    </div>
  );
}

interface PreviewStepProps {
  response: CsvImportApiResponse;
  currency: Account["currency"];
  loading: boolean;
  onBack: () => void;
  onImport: () => void;
}

function PreviewStep({
  response,
  currency,
  loading,
  onBack,
  onImport,
}: PreviewStepProps) {
  const summary = response.summary;
  const rows = response.previewRows;

  if (!summary || !rows) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <PreviewMetric label="Total rows" value={summary.totalRows} />

        <PreviewMetric
          label="Ready"
          value={summary.readyRows}
          variant="success"
        />

        <PreviewMetric
          label="Duplicates"
          value={summary.duplicateRows}
          variant="warning"
        />

        <PreviewMetric
          label="Invalid"
          value={summary.invalidRows}
          variant="danger"
        />
      </div>

      <div className="max-h-[420px] overflow-auto rounded-xl border border-white/[0.07]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="sticky top-0 bg-[#10151f] text-xs text-white/35">
            <tr>
              <th className="px-4 py-3">Row</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber} className="border-t border-white/[0.055]">
                <td className="px-4 py-3 text-white/30">{row.rowNumber}</td>

                <td className="px-4 py-3 text-white/50">
                  {row.transactionDate ?? "Invalid"}
                </td>

                <td className="max-w-72 px-4 py-3">
                  <p className="truncate text-white/70">
                    {row.description || "Missing description"}
                  </p>

                  {row.errors[0] && (
                    <p className="mt-1 text-xs text-red-300">{row.errors[0]}</p>
                  )}

                  {row.warnings[0] && (
                    <p className="mt-1 text-xs text-amber-300">
                      {row.warnings[0]}
                    </p>
                  )}
                </td>

                <td className="px-4 py-3 capitalize text-white/50">
                  {row.transactionKind ?? "Invalid"}
                </td>

                <td className="px-4 py-3 text-white/50">
                  {row.categoryName ?? "Uncategorized"}
                </td>

                <td className="px-4 py-3 text-right font-medium text-white/70">
                  {row.amount !== null
                    ? formatCurrency(row.amount, currency)
                    : "—"}
                </td>

                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-5 text-white/30">
        Duplicate and invalid rows will be skipped. Only rows marked Ready will
        be imported.
      </p>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={onBack}
          className="border-white/10 bg-transparent text-white/55"
        >
          <ArrowLeft className="size-4" />
          Change mapping
        </Button>

        <Button
          type="button"
          disabled={loading || summary.readyRows === 0}
          onClick={onImport}
          className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" />}
          Import {summary.readyRows}{" "}
          {summary.readyRows === 1 ? "transaction" : "transactions"}
        </Button>
      </div>
    </div>
  );
}

interface CompleteStepProps {
  response: CsvImportApiResponse;
  onImportAnother: () => void;
}

function CompleteStep({ response, onImportAnother }: CompleteStepProps) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
        <CheckCircle2 className="size-8 text-emerald-300" />
      </div>

      <h3 className="mt-5 text-xl font-semibold">Import completed</h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/40">
        {response.message}
      </p>

      <div className="mt-7 flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={onImportAnother}
          className="border-white/10 bg-transparent text-white/60"
        >
          Import another CSV
        </Button>
      </div>
    </div>
  );
}

function WizardProgress({ step }: { step: WizardStep }) {
  const steps = ["upload", "mapping", "preview", "complete"] as const;

  const activeIndex = steps.indexOf(step);

  return (
    <div className="grid grid-cols-4 gap-2">
      {steps.map((wizardStep, index) => (
        <div
          key={wizardStep}
          className={cn(
            "h-1.5 rounded-full",
            index <= activeIndex ? "bg-cyan-300" : "bg-white/[0.07]",
          )}
        />
      ))}
    </div>
  );
}

function MappingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-sm text-white/65">{label}</span>

      {children}
    </label>
  );
}

function ColumnSelect({
  headers,
  value,
  required = false,
  onChange,
}: {
  headers: string[];
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      className={selectClassName}
    >
      <option value="" className="bg-[#0b0f17]">
        {required ? "Select a column" : "Not mapped"}
      </option>

      {headers.map((header) => (
        <option key={header} value={header} className="bg-[#0b0f17]">
          {header}
        </option>
      ))}
    </select>
  );
}

function PreviewMetric({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const valueClass = {
    default: "text-white",
    success: "text-emerald-300",
    warning: "text-amber-300",
    danger: "text-red-300",
  }[variant];

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <p className="text-xs text-white/30">{label}</p>

      <p className={cn("mt-2 text-xl font-semibold", valueClass)}>{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "ready" | "duplicate" | "invalid";
}) {
  const classes = {
    ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",

    duplicate: "border-amber-400/20 bg-amber-400/10 text-amber-200",

    invalid: "border-red-400/20 bg-red-400/10 text-red-200",
  }[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs capitalize",
        classes,
      )}
    >
      {status}
    </span>
  );
}

function validateMapping(mapping: CsvColumnMapping): string | null {
  if (!mapping.dateColumn) {
    return "Select the transaction-date column.";
  }

  if (!mapping.descriptionColumn) {
    return "Select the description column.";
  }

  if (mapping.amountMode === "signed" && !mapping.amountColumn) {
    return "Select the amount column.";
  }

  if (
    mapping.amountMode === "debit_credit" &&
    (!mapping.debitColumn || !mapping.creditColumn)
  ) {
    return "Select both the debit and credit columns.";
  }

  return null;
}

function parseCsvFile(file: File): Promise<{
  headers: string[];
  rows: CsvRawRow[];
}> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",

      transformHeader(header) {
        return header.trim();
      },

      complete(results) {
        const headers = results.meta.fields?.filter(Boolean) ?? [];

        if (headers.length === 0) {
          reject(new Error("The CSV must contain a header row."));
          return;
        }

        const seriousError = results.errors.find(
          (parseError) =>
            parseError.type === "Quotes" || parseError.code === "TooManyFields",
        );

        if (seriousError) {
          reject(
            new Error(
              `CSV parsing error near row ${
                (seriousError.row ?? 0) + 2
              }: ${seriousError.message}`,
            ),
          );
          return;
        }

        const rows = results.data.map((row) => {
          const normalizedRow: CsvRawRow = {};

          for (const header of headers) {
            const value = row[header];

            normalizedRow[header] =
              value === null || value === undefined ? "" : String(value);
          }

          return normalizedRow;
        });

        resolve({
          headers,
          rows,
        });
      },

      error(parseError) {
        reject(parseError);
      },
    });
  });
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

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10";
