"use client";

import * as React from "react";
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
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Account } from "@/features/accounts/account.types";
import type {
  CsvColumnMapping,
  CsvImportApiResponse,
  CsvPreparedRow,
  CsvPreviewRow,
  CsvRawRow,
} from "@/features/transactions/csv-import.types";
import {
  inferCsvMapping,
  prepareCsvRows,
} from "@/features/transactions/csv-import-utils";
import type { TransactionCategory } from "@/features/transactions/transaction.types";
import { formatCurrency } from "@/lib/finance/currency";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 500;

type WizardStep = "upload" | "mapping" | "preview" | "complete";

type PendingAction = "parsing" | "previewing" | "importing" | null;

type MappingValidationField =
  | "dateColumn"
  | "descriptionColumn"
  | "amountColumn"
  | "debitColumn"
  | "creditColumn";

interface MappingValidationIssue {
  field: MappingValidationField;
  message: string;
}

interface CsvImportDialogProps {
  accounts: Account[];
  categories: TransactionCategory[];
}

export function CsvImportDialog({
  accounts,
  categories,
}: CsvImportDialogProps) {
  const [open, setOpen] = React.useState(false);

  const disabledReasonId = React.useId();

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
            aria-describedby={canImport ? undefined : disabledReasonId}
            className="border-white/10 bg-white/[0.035] text-white/65 hover:bg-white/[0.07] hover:text-white"
          />
        }
      >
        <Upload className="size-4" />
        Import CSV
      </DialogTrigger>

      {!canImport && (
        <span id={disabledReasonId} className="sr-only">
          Create an active bank or cash account before importing transactions.
        </span>
      )}

      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Import transactions</DialogTitle>

          <DialogDescription>
            Map your CSV columns, review every transaction, and import valid
            non-duplicate rows.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CsvImportWizard
            accounts={accounts}
            categories={categories}
            onClose={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CsvImportWizardProps {
  accounts: Account[];
  categories: TransactionCategory[];
  onClose: () => void;
}

function CsvImportWizard({
  accounts,
  categories,
  onClose,
}: CsvImportWizardProps) {
  const router = useRouter();

  const wizardId = React.useId();

  const sourceAccounts = React.useMemo(
    () =>
      accounts.filter(
        (account) => account.isActive && account.accountType !== "loan",
      ),
    [accounts],
  );

  const incomeCategories = React.useMemo(
    () => categories.filter((category) => category.kind === "income"),
    [categories],
  );

  const expenseCategories = React.useMemo(
    () => categories.filter((category) => category.kind === "expense"),
    [categories],
  );

  const [step, setStep] = React.useState<WizardStep>("upload");

  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);

  const [file, setFile] = React.useState<File | null>(null);

  const [headers, setHeaders] = React.useState<string[]>([]);

  const [rawRows, setRawRows] = React.useState<CsvRawRow[]>([]);

  const [mapping, setMapping] = React.useState<CsvColumnMapping | null>(null);

  const [accountId, setAccountId] = React.useState(sourceAccounts[0]?.id ?? "");

  const [incomeFallbackCategoryId, setIncomeFallbackCategoryId] =
    React.useState(
      incomeCategories.find((category) => category.name === "Other Income")
        ?.id ??
        incomeCategories[0]?.id ??
        "",
    );

  const [expenseFallbackCategoryId, setExpenseFallbackCategoryId] =
    React.useState(
      expenseCategories.find((category) => category.name === "Other Expense")
        ?.id ??
        expenseCategories[0]?.id ??
        "",
    );

  const [preparedRows, setPreparedRows] = React.useState<CsvPreparedRow[]>([]);

  const [response, setResponse] = React.useState<CsvImportApiResponse | null>(
    null,
  );

  const [error, setError] = React.useState<string | null>(null);

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

    setPendingAction("parsing");

    try {
      const parsed = await parseCsvFile(selectedFile);

      if (parsed.rows.length === 0) {
        throw new Error("The CSV does not contain any transaction rows.");
      }

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
      setPendingAction(null);
    }
  }

  async function requestPreview() {
    if (!mapping || !file) {
      return;
    }

    const mappingIssue = validateMapping(mapping);

    if (mappingIssue) {
      setError(mappingIssue.message);
      return;
    }

    if (!accountId) {
      setError("Select the account that should receive these transactions.");
      return;
    }

    if (!incomeFallbackCategoryId || !expenseFallbackCategoryId) {
      setError("Select valid fallback income and expense categories.");
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

      toast.success(result.message ?? "CSV import completed.");
    }
  }

  async function submitImport(
    mode: "preview" | "commit",
    rows: CsvPreparedRow[],
  ): Promise<CsvImportApiResponse | null> {
    if (!file) {
      return null;
    }

    setPendingAction(mode === "preview" ? "previewing" : "importing");

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

      const responseText = await apiResponse.text();

      let result: CsvImportApiResponse;

      try {
        result = JSON.parse(responseText) as CsvImportApiResponse;
      } catch {
        throw new Error("The import service returned an unreadable response.");
      }

      setResponse(result);

      if (!apiResponse.ok || !result.success) {
        setError(result.error ?? "The CSV import failed.");

        return result;
      }

      return result;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "FinSight could not reach the import service.",
      );

      return null;
    } finally {
      setPendingAction(null);
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
    setPendingAction(null);
  }

  const previewCurrency =
    response?.currency ?? selectedAccount?.currency ?? "USD";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-white/[0.07] px-6 py-4">
        <WizardProgress step={step} />
      </div>

      {error && (
        <div className="shrink-0 px-6 pt-4">
          <ImportErrorMessage message={error} />
        </div>
      )}

      {step === "upload" && (
        <UploadStep
          inputId={`${wizardId}-file`}
          loading={pendingAction === "parsing"}
          onFile={handleFile}
        />
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
          loading={pendingAction === "previewing"}
          onClearError={() => {
            setError(null);
          }}
          onBack={resetWizard}
          onPreview={requestPreview}
        />
      )}

      {step === "preview" && response?.summary && response.previewRows && (
        <PreviewStep
          response={response}
          currency={previewCurrency}
          loading={pendingAction === "importing"}
          onBack={() => {
            setError(null);
            setStep("mapping");
          }}
          onImport={commitImport}
        />
      )}

      {step === "complete" && response?.summary && (
        <CompleteStep
          response={response}
          onImportAnother={resetWizard}
          onClose={onClose}
        />
      )}
    </div>
  );
}

interface UploadStepProps {
  inputId: string;
  loading: boolean;

  onFile: (file: File | undefined) => void;
}

function UploadStep({ inputId, loading, onFile }: UploadStepProps) {
  const [dragActive, setDragActive] = React.useState(false);

  const descriptionId = `${inputId}-description`;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      <input
        id={inputId}
        type="file"
        accept=".csv,text/csv"
        disabled={loading}
        aria-describedby={descriptionId}
        className="peer sr-only"
        onChange={(event) => {
          const selectedFile = event.currentTarget.files?.[0];

          event.currentTarget.value = "";

          void onFile(selectedFile);
        }}
      />

      <label
        htmlFor={inputId}
        aria-disabled={loading}
        onDragEnter={(event) => {
          event.preventDefault();

          if (!loading) {
            setDragActive(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          event.preventDefault();

          if (event.currentTarget === event.target) {
            setDragActive(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);

          if (!loading) {
            void onFile(event.dataTransfer.files?.[0]);
          }
        }}
        className={cn(
          [
            "flex min-h-72",
            "cursor-pointer flex-col",
            "items-center justify-center",
            "rounded-2xl",
            "border border-dashed",
            "px-6 text-center",
            "outline-none",
            "transition-[border-color,background-color,box-shadow]",
            "peer-focus-visible:border-cyan-300/50",
            "peer-focus-visible:ring-2",
            "peer-focus-visible:ring-cyan-300/20",
          ].join(" "),

          dragActive
            ? "border-cyan-300/45 bg-cyan-300/[0.06]"
            : "border-white/10 bg-white/[0.02] hover:border-cyan-300/25 hover:bg-cyan-300/[0.025]",

          loading && "cursor-wait opacity-70",
        )}
      >
        {loading ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-9 animate-spin text-cyan-300"
          />
        ) : (
          <FileSpreadsheet
            aria-hidden="true"
            className="size-10 text-cyan-300"
          />
        )}

        <h3 className="mt-5 text-base font-semibold tracking-[-0.015em] text-white">
          {loading
            ? "Reading CSV file..."
            : dragActive
              ? "Drop your CSV here"
              : "Select a CSV statement"}
        </h3>

        <p
          id={descriptionId}
          className="mt-2 max-w-md text-sm leading-6 text-white/38"
        >
          Choose a file or drag it into this area. The CSV is parsed locally
          before normalized transaction data is sent to FinSight.
        </p>

        <span className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/70">
          Choose CSV file
        </span>

        <p className="mt-4 text-xs text-white/28">
          Maximum 5 MB and 500 data rows
        </p>
      </label>
    </div>
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

  onClearError: () => void;
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
  onClearError,
  onBack,
  onPreview,
}: MappingStepProps) {
  const idPrefix = React.useId();

  const fieldRefs = React.useRef<
    Partial<Record<MappingValidationField, HTMLSelectElement>>
  >({});

  const [validationIssue, setValidationIssue] =
    React.useState<MappingValidationIssue | null>(null);

  const ids = {
    account: `${idPrefix}-account`,

    dateFormat: `${idPrefix}-date-format`,

    dateColumn: `${idPrefix}-date-column`,

    descriptionColumn: `${idPrefix}-description-column`,

    amountMode: `${idPrefix}-amount-mode`,

    amountColumn: `${idPrefix}-amount-column`,

    positiveMeaning: `${idPrefix}-positive-meaning`,

    debitColumn: `${idPrefix}-debit-column`,

    creditColumn: `${idPrefix}-credit-column`,

    merchantColumn: `${idPrefix}-merchant-column`,

    categoryColumn: `${idPrefix}-category-column`,

    notesColumn: `${idPrefix}-notes-column`,

    incomeFallback: `${idPrefix}-income-fallback`,

    expenseFallback: `${idPrefix}-expense-fallback`,
  };

  const missingFallbackCategories =
    incomeCategories.length === 0 || expenseCategories.length === 0;

  function updateMapping(update: Partial<CsvColumnMapping>) {
    setMapping((current) =>
      current
        ? {
            ...current,
            ...update,
          }
        : current,
    );

    setValidationIssue(null);
    onClearError();
  }

  function handlePreview() {
    const issue = validateMapping(mapping);

    if (issue) {
      setValidationIssue(issue);

      requestAnimationFrame(() => {
        fieldRefs.current[issue.field]?.focus();
      });

      return;
    }

    setValidationIssue(null);
    onPreview();
  }

  function fieldError(field: MappingValidationField): string | undefined {
    return validationIssue?.field === field
      ? validationIssue.message
      : undefined;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-5">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
              <FileSpreadsheet className="size-4" />
            </div>

            <div className="min-w-0">
              <p
                title={file.name}
                className="truncate text-sm font-semibold text-white/75"
              >
                {file.name}
              </p>

              <p className="mt-1 text-xs text-white/32">
                {formatFileSize(file.size)}
                {" · "}
                {rowCount} {rowCount === 1 ? "data row" : "data rows"}
              </p>
            </div>
          </div>
        </div>

        <fieldset className="space-y-5">
          <legend className="section-title">Destination and format</legend>

          <p className="section-description">
            Choose where transactions should be imported and how dates are
            represented.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <MappingField
              id={ids.account}
              label="Import into"
              required
              description="All transactions in this file will be added to this account."
            >
              <select
                id={ids.account}
                value={selectedAccountId}
                required
                disabled={sourceAccounts.length === 0}
                aria-describedby={`${ids.account}-description`}
                onChange={(event) => {
                  setSelectedAccountId(event.target.value);

                  onClearError();
                }}
                className={selectClassName}
              >
                {sourceAccounts.map((account) => (
                  <option
                    key={account.id}
                    value={account.id}
                    className="bg-[#0b0f17]"
                  >
                    {account.name}
                    {" · "}
                    {account.currency}
                  </option>
                ))}
              </select>
            </MappingField>

            <MappingField
              id={ids.dateFormat}
              label="Date format"
              required
              description="Select the format used by transaction dates in the CSV."
            >
              <select
                id={ids.dateFormat}
                value={mapping.dateFormat}
                required
                aria-describedby={`${ids.dateFormat}-description`}
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
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-white/[0.06] pt-7">
          <legend className="section-title">
            Required transaction columns
          </legend>

          <p className="section-description">
            Tell FinSight which CSV columns contain the core transaction values.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <MappingField
              id={ids.dateColumn}
              label="Date column"
              required
              error={fieldError("dateColumn")}
            >
              <ColumnSelect
                ref={(node) => {
                  if (node) {
                    fieldRefs.current.dateColumn = node;
                  }
                }}
                id={ids.dateColumn}
                headers={headers}
                value={mapping.dateColumn}
                required
                invalid={Boolean(fieldError("dateColumn"))}
                error={fieldError("dateColumn")}
                onChange={(value) => {
                  updateMapping({
                    dateColumn: value,
                  });
                }}
              />
            </MappingField>

            <MappingField
              id={ids.descriptionColumn}
              label="Description column"
              required
              error={fieldError("descriptionColumn")}
            >
              <ColumnSelect
                ref={(node) => {
                  if (node) {
                    fieldRefs.current.descriptionColumn = node;
                  }
                }}
                id={ids.descriptionColumn}
                headers={headers}
                value={mapping.descriptionColumn}
                required
                invalid={Boolean(fieldError("descriptionColumn"))}
                error={fieldError("descriptionColumn")}
                onChange={(value) => {
                  updateMapping({
                    descriptionColumn: value,
                  });
                }}
              />
            </MappingField>

            <MappingField
              id={ids.amountMode}
              label="Amount format"
              required
              description="Choose whether the CSV uses one signed amount column or separate debit and credit columns."
              className="md:col-span-2"
            >
              <select
                id={ids.amountMode}
                value={mapping.amountMode}
                required
                aria-describedby={`${ids.amountMode}-description`}
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
                  Separate debit and credit columns
                </option>
              </select>
            </MappingField>

            {mapping.amountMode === "signed" ? (
              <>
                <MappingField
                  id={ids.amountColumn}
                  label="Amount column"
                  required
                  error={fieldError("amountColumn")}
                >
                  <ColumnSelect
                    ref={(node) => {
                      if (node) {
                        fieldRefs.current.amountColumn = node;
                      }
                    }}
                    id={ids.amountColumn}
                    headers={headers}
                    value={mapping.amountColumn}
                    required
                    invalid={Boolean(fieldError("amountColumn"))}
                    error={fieldError("amountColumn")}
                    onChange={(value) => {
                      updateMapping({
                        amountColumn: value,
                      });
                    }}
                  />
                </MappingField>

                <MappingField
                  id={ids.positiveMeaning}
                  label="Positive amounts mean"
                  required
                  description="Some bank exports represent withdrawals as positive values."
                >
                  <select
                    id={ids.positiveMeaning}
                    value={mapping.positiveMeaning}
                    required
                    aria-describedby={`${ids.positiveMeaning}-description`}
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
                <MappingField
                  id={ids.debitColumn}
                  label="Debit column"
                  required
                  error={fieldError("debitColumn")}
                >
                  <ColumnSelect
                    ref={(node) => {
                      if (node) {
                        fieldRefs.current.debitColumn = node;
                      }
                    }}
                    id={ids.debitColumn}
                    headers={headers}
                    value={mapping.debitColumn}
                    required
                    invalid={Boolean(fieldError("debitColumn"))}
                    error={fieldError("debitColumn")}
                    onChange={(value) => {
                      updateMapping({
                        debitColumn: value,
                      });
                    }}
                  />
                </MappingField>

                <MappingField
                  id={ids.creditColumn}
                  label="Credit column"
                  required
                  error={fieldError("creditColumn")}
                >
                  <ColumnSelect
                    ref={(node) => {
                      if (node) {
                        fieldRefs.current.creditColumn = node;
                      }
                    }}
                    id={ids.creditColumn}
                    headers={headers}
                    value={mapping.creditColumn}
                    required
                    invalid={Boolean(fieldError("creditColumn"))}
                    error={fieldError("creditColumn")}
                    onChange={(value) => {
                      updateMapping({
                        creditColumn: value,
                      });
                    }}
                  />
                </MappingField>
              </>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-white/[0.06] pt-7">
          <legend className="section-title">Optional columns</legend>

          <p className="section-description">
            These fields improve transaction detail but are not required.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <MappingField id={ids.merchantColumn} label="Merchant column">
              <ColumnSelect
                id={ids.merchantColumn}
                headers={headers}
                value={mapping.merchantColumn}
                onChange={(value) => {
                  updateMapping({
                    merchantColumn: value,
                  });
                }}
              />
            </MappingField>

            <MappingField id={ids.categoryColumn} label="Category column">
              <ColumnSelect
                id={ids.categoryColumn}
                headers={headers}
                value={mapping.categoryColumn}
                onChange={(value) => {
                  updateMapping({
                    categoryColumn: value,
                  });
                }}
              />
            </MappingField>

            <MappingField
              id={ids.notesColumn}
              label="Notes column"
              className="md:col-span-2"
            >
              <ColumnSelect
                id={ids.notesColumn}
                headers={headers}
                value={mapping.notesColumn}
                onChange={(value) => {
                  updateMapping({
                    notesColumn: value,
                  });
                }}
              />
            </MappingField>
          </div>
        </fieldset>

        <fieldset className="space-y-5 border-t border-white/[0.06] pt-7">
          <legend className="section-title">Fallback categories</legend>

          <p className="section-description">
            Unmatched or missing CSV categories will use these selections.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <MappingField
              id={ids.incomeFallback}
              label="Fallback income category"
              required
            >
              <select
                id={ids.incomeFallback}
                value={incomeFallbackCategoryId}
                required
                disabled={incomeCategories.length === 0}
                onChange={(event) => {
                  setIncomeFallbackCategoryId(event.target.value);

                  onClearError();
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

            <MappingField
              id={ids.expenseFallback}
              label="Fallback expense category"
              required
            >
              <select
                id={ids.expenseFallback}
                value={expenseFallbackCategoryId}
                required
                disabled={expenseCategories.length === 0}
                onChange={(event) => {
                  setExpenseFallbackCategoryId(event.target.value);

                  onClearError();
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
        </fieldset>

        {missingFallbackCategories && (
          <div
            role="alert"
            className="rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-xs leading-5 text-amber-200"
          >
            FinSight needs at least one income category and one expense category
            before transactions can be imported.
          </div>
        )}

        <aside className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3 text-xs leading-5 text-cyan-100/60">
          Category names are matched case-insensitively. Missing or unmatched
          categories use the selected fallback category.
        </aside>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/[0.07] bg-white/[0.018] px-6 py-4 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={onBack}
          className="border-white/10 bg-transparent text-white/55"
        >
          <ArrowLeft className="size-4" />
          Choose another file
        </Button>

        <Button
          type="button"
          disabled={loading || missingFallbackCategories}
          onClick={handlePreview}
          className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
        >
          {loading && <LoaderCircle className="size-4 animate-spin" />}

          {loading ? "Preparing preview..." : "Preview import"}
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <section
          aria-label="CSV preview summary"
          aria-live="polite"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
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
        </section>

        <div className="space-y-3 md:hidden">
          {rows.map((row) => (
            <PreviewRowCard key={row.rowNumber} row={row} currency={currency} />
          ))}
        </div>

        <div className="hidden max-h-[430px] overflow-auto rounded-xl border border-white/[0.07] md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <caption className="sr-only">
              CSV transaction preview showing row number, date, description,
              type, category, amount, and import status.
            </caption>

            <thead className="sticky top-0 z-10 bg-[#10151f]">
              <tr>
                <PreviewTableHead>Row</PreviewTableHead>

                <PreviewTableHead>Date</PreviewTableHead>

                <PreviewTableHead>Description</PreviewTableHead>

                <PreviewTableHead>Type</PreviewTableHead>

                <PreviewTableHead>Category</PreviewTableHead>

                <PreviewTableHead className="text-right">
                  Amount
                </PreviewTableHead>

                <PreviewTableHead>Status</PreviewTableHead>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.rowNumber}
                  className="border-t border-white/[0.055] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="financial-number px-4 py-3 text-white/32">
                    {row.rowNumber}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-white/50">
                    {row.transactionDate ?? "Invalid"}
                  </td>

                  <td className="max-w-72 px-4 py-3">
                    <p
                      title={row.description}
                      className="truncate font-medium text-white/72"
                    >
                      {row.description || "Missing description"}
                    </p>

                    <PreviewIssues row={row} />
                  </td>

                  <td className="px-4 py-3 capitalize text-white/50">
                    {row.transactionKind ?? "Invalid"}
                  </td>

                  <td className="px-4 py-3 text-white/50">
                    {row.categoryName ?? "Uncategorized"}
                  </td>

                  <td className="financial-number whitespace-nowrap px-4 py-3 text-right font-semibold text-white/72">
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

        <p className="text-xs leading-5 text-white/32">
          Duplicate and invalid rows will be skipped. Only rows marked Ready
          will be imported.
        </p>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/[0.07] bg-white/[0.018] px-6 py-4 sm:flex-row sm:justify-between">
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

          {loading
            ? "Importing transactions..."
            : `Import ${summary.readyRows} ${
                summary.readyRows === 1 ? "transaction" : "transactions"
              }`}
        </Button>
      </div>
    </div>
  );
}

function PreviewRowCard({
  row,
  currency,
}: {
  row: CsvPreviewRow;
  currency: Account["currency"];
}) {
  return (
    <article className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/30">
            Row {row.rowNumber}
          </p>

          <h3 className="mt-1 truncate text-sm font-semibold text-white/75">
            {row.description || "Missing description"}
          </h3>

          <p className="mt-1 text-xs text-white/35">
            {row.transactionDate ?? "Invalid date"}
          </p>
        </div>

        <StatusBadge status={row.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4 text-xs">
        <div>
          <dt className="text-white/28">Type</dt>

          <dd className="mt-1 capitalize text-white/58">
            {row.transactionKind ?? "Invalid"}
          </dd>
        </div>

        <div>
          <dt className="text-white/28">Category</dt>

          <dd className="mt-1 truncate text-white/58">
            {row.categoryName ?? "Uncategorized"}
          </dd>
        </div>

        <div className="col-span-2">
          <dt className="text-white/28">Amount</dt>

          <dd className="financial-number mt-1 font-semibold text-white/70">
            {row.amount !== null ? formatCurrency(row.amount, currency) : "—"}
          </dd>
        </div>
      </dl>

      <PreviewIssues row={row} />
    </article>
  );
}

function PreviewIssues({ row }: { row: CsvPreviewRow }) {
  const firstError = row.errors[0];

  const firstWarning = row.warnings[0];

  return (
    <>
      {firstError && (
        <p className="mt-2 text-xs leading-5 text-red-300">
          {firstError}

          {row.errors.length > 1 && <span> +{row.errors.length - 1} more</span>}
        </p>
      )}

      {!firstError && firstWarning && (
        <p className="mt-2 text-xs leading-5 text-amber-300">
          {firstWarning}

          {row.warnings.length > 1 && (
            <span> +{row.warnings.length - 1} more</span>
          )}
        </p>
      )}
    </>
  );
}

function PreviewTableHead({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.11em] text-white/35",
        className,
      )}
    >
      {children}
    </th>
  );
}

interface CompleteStepProps {
  response: CsvImportApiResponse;
  onImportAnother: () => void;
  onClose: () => void;
}

function CompleteStep({
  response,
  onImportAnother,
  onClose,
}: CompleteStepProps) {
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const summary = response.summary;

  if (!summary) {
    return null;
  }

  const importedRows = summary.importedRows ?? summary.readyRows;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="status"
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto px-6 py-12 text-center"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
          <CheckCircle2
            aria-hidden="true"
            className="size-8 text-emerald-300"
          />
        </div>

        <h3
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-xl font-semibold tracking-[-0.02em] text-white outline-none"
        >
          Import completed
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/42">
          {response.message ??
            `${importedRows} transactions were imported successfully.`}
        </p>

        <dl className="mx-auto mt-7 grid max-w-xl gap-3 sm:grid-cols-3">
          <CompleteMetric
            label="Imported"
            value={importedRows}
            className="text-emerald-300"
          />

          <CompleteMetric
            label="Duplicates skipped"
            value={summary.duplicateRows}
            className="text-amber-300"
          />

          <CompleteMetric
            label="Invalid skipped"
            value={summary.invalidRows}
            className="text-red-300"
          />
        </dl>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/[0.07] bg-white/[0.018] px-6 py-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onImportAnother}
          className="border-white/10 bg-transparent text-white/60"
        >
          Import another CSV
        </Button>

        <Button
          type="button"
          onClick={onClose}
          className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

function CompleteMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
      <dt className="text-xs text-white/30">{label}</dt>

      <dd
        className={cn("financial-number mt-2 text-lg font-semibold", className)}
      >
        {value}
      </dd>
    </div>
  );
}

function WizardProgress({ step }: { step: WizardStep }) {
  const steps: Array<{
    id: WizardStep;
    label: string;
  }> = [
    {
      id: "upload",
      label: "Upload",
    },
    {
      id: "mapping",
      label: "Map columns",
    },
    {
      id: "preview",
      label: "Preview",
    },
    {
      id: "complete",
      label: "Complete",
    },
  ];

  const activeIndex = steps.findIndex((item) => item.id === step);

  return (
    <ol aria-label="CSV import progress" className="grid grid-cols-4 gap-2">
      {steps.map((wizardStep, index) => {
        const active = index === activeIndex;

        const complete = index < activeIndex;

        return (
          <li
            key={wizardStep.id}
            aria-current={active ? "step" : undefined}
            className="min-w-0"
          >
            <div
              aria-hidden="true"
              className={cn(
                "h-1.5 rounded-full",

                index <= activeIndex ? "bg-cyan-300" : "bg-white/[0.07]",
              )}
            />

            <p
              className={cn(
                "mt-2 truncate text-[0.6875rem] font-medium",

                active
                  ? "text-cyan-200"
                  : complete
                    ? "text-white/50"
                    : "text-white/25",
              )}
            >
              {wizardStep.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function MappingField({
  id,
  label,
  description,
  error,
  required = false,
  className,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-[0.8125rem] font-medium leading-5 text-white/65"
      >
        {label}

        {required && (
          <>
            <span aria-hidden="true" className="ml-1 text-red-300">
              *
            </span>

            <span className="sr-only"> required</span>
          </>
        )}
      </label>

      {description && (
        <p id={`${id}-description`} className="text-xs leading-5 text-white/32">
          {description}
        </p>
      )}

      {children}

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

interface ColumnSelectProps {
  id: string;
  headers: string[];
  value: string;
  required?: boolean;
  invalid?: boolean;
  error?: string;

  onChange: (value: string) => void;
}

const ColumnSelect = React.forwardRef<HTMLSelectElement, ColumnSelectProps>(
  function ColumnSelect(
    { id, headers, value, required = false, invalid = false, error, onChange },
    ref,
  ) {
    return (
      <select
        ref={ref}
        id={id}
        value={value}
        required={required}
        aria-invalid={invalid}
        aria-describedby={error ? `${id}-error` : undefined}
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
  },
);

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
      <p className="text-xs font-medium text-white/30">{label}</p>

      <p
        className={cn(
          "financial-number mt-2 text-xl font-semibold",
          valueClass,
        )}
      >
        {value}
      </p>
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
        "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        classes,
      )}
    >
      {status}
    </span>
  );
}

function ImportErrorMessage({ message }: { message: string }) {
  const errorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    errorRef.current?.focus();
  }, [message]);

  return (
    <div
      ref={errorRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200 outline-none"
    >
      <AlertTriangle aria-hidden="true" className="mt-1 size-4 shrink-0" />

      <span>{message}</span>
    </div>
  );
}

function validateMapping(
  mapping: CsvColumnMapping,
): MappingValidationIssue | null {
  if (!mapping.dateColumn) {
    return {
      field: "dateColumn",

      message: "Select the transaction-date column.",
    };
  }

  if (!mapping.descriptionColumn) {
    return {
      field: "descriptionColumn",

      message: "Select the description column.",
    };
  }

  if (mapping.amountMode === "signed" && !mapping.amountColumn) {
    return {
      field: "amountColumn",

      message: "Select the amount column.",
    };
  }

  if (mapping.amountMode === "debit_credit" && !mapping.debitColumn) {
    return {
      field: "debitColumn",

      message: "Select the debit column.",
    };
  }

  if (mapping.amountMode === "debit_credit" && !mapping.creditColumn) {
    return {
      field: "creditColumn",

      message: "Select the credit column.",
    };
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
        const rawHeaders = results.meta.fields ?? [];

        const headers = rawHeaders.map((header) => header.trim());

        if (headers.length === 0) {
          reject(new Error("The CSV must contain a header row."));

          return;
        }

        if (headers.some((header) => !header)) {
          reject(new Error("Every CSV column must have a header name."));

          return;
        }

        const normalizedHeaders = headers.map(normalizeCsvHeader);

        const duplicateHeader = normalizedHeaders.find(
          (header, index) => normalizedHeaders.indexOf(header) !== index,
        );

        if (duplicateHeader) {
          reject(
            new Error(
              "The CSV contains duplicate column headers. Rename duplicate columns and try again.",
            ),
          );

          return;
        }

        const seriousError = results.errors.find(
          (parseError) =>
            parseError.type === "Quotes" || parseError.code === "TooManyFields",
        );

        if (seriousError) {
          reject(
            new Error(
              `CSV parsing error near row ${(seriousError.row ?? 0) + 2}: ${
                seriousError.message
              }`,
            ),
          );

          return;
        }

        const rows = results.data
          .map((row) => {
            const normalizedRow: CsvRawRow = {};

            for (const header of headers) {
              const value = row[header];

              normalizedRow[header] =
                value === null || value === undefined ? "" : String(value);
            }

            return normalizedRow;
          })
          .filter((row) =>
            Object.values(row).some((value) => value.trim().length > 0),
          );

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

function normalizeCsvHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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
  "disabled:cursor-not-allowed",
  "disabled:opacity-50",
  "aria-invalid:border-red-400/45",
  "aria-invalid:ring-2",
  "aria-invalid:ring-red-400/15",
].join(" ");
