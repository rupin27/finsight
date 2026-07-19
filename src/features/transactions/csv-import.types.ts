import type { AccountCurrency } from "@/features/accounts/account.types";
import type { TransactionKind } from "@/features/transactions/transaction.types";

export const CSV_DATE_FORMATS = [
  "yyyy-mm-dd",
  "mm/dd/yyyy",
  "dd/mm/yyyy",
] as const;

export const CSV_AMOUNT_MODES = ["signed", "debit_credit"] as const;

export const CSV_POSITIVE_MEANINGS = ["income", "expense"] as const;

export type CsvDateFormat = (typeof CSV_DATE_FORMATS)[number];

export type CsvAmountMode = (typeof CSV_AMOUNT_MODES)[number];

export type CsvPositiveMeaning = (typeof CSV_POSITIVE_MEANINGS)[number];

export type CsvRawRow = Record<string, string>;

export interface CsvColumnMapping {
  dateColumn: string;
  descriptionColumn: string;

  amountMode: CsvAmountMode;
  amountColumn: string;
  debitColumn: string;
  creditColumn: string;

  positiveMeaning: CsvPositiveMeaning;
  dateFormat: CsvDateFormat;

  merchantColumn: string;
  categoryColumn: string;
  notesColumn: string;
}

export interface CsvPreparedRow {
  rowNumber: number;

  transactionDate: string | null;
  description: string;
  amount: number | null;
  transactionKind: Extract<TransactionKind, "income" | "expense"> | null;

  merchant: string | null;
  categoryName: string | null;
  notes: string | null;

  clientErrors: string[];
}

export type CsvPreviewStatus = "ready" | "duplicate" | "invalid";

export interface CsvPreviewRow {
  rowNumber: number;

  transactionDate: string | null;
  description: string;
  amount: number | null;
  transactionKind: "income" | "expense" | null;

  merchant: string | null;
  categoryName: string | null;

  status: CsvPreviewStatus;
  errors: string[];
  warnings: string[];
}

export interface CsvImportSummary {
  totalRows: number;
  readyRows: number;
  duplicateRows: number;
  invalidRows: number;
  importedRows?: number;
}

export interface CsvImportApiResponse {
  success: boolean;
  error?: string;
  message?: string;

  currency?: AccountCurrency;
  previewRows?: CsvPreviewRow[];
  summary?: CsvImportSummary;
}

export interface CsvImportRecord {
  id: string;
  accountId: string | null;

  filename: string;
  fileSizeBytes: number;

  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;

  status: "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
}
