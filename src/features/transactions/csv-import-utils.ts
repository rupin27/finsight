import type {
  CsvColumnMapping,
  CsvDateFormat,
  CsvPreparedRow,
  CsvRawRow,
} from "@/features/transactions/csv-import.types";

export function inferCsvMapping(headers: string[]): CsvColumnMapping {
  return {
    dateColumn: findHeader(headers, [
      "transaction date",
      "posting date",
      "posted date",
      "date",
    ]),

    descriptionColumn: findHeader(headers, [
      "description",
      "transaction description",
      "details",
      "narration",
      "memo",
      "name",
    ]),

    amountMode: hasMatchingHeader(headers, [
      "debit",
      "withdrawal",
      "withdrawals",
    ])
      ? "debit_credit"
      : "signed",

    amountColumn: findHeader(headers, [
      "amount",
      "transaction amount",
      "value",
    ]),

    debitColumn: findHeader(headers, [
      "debit",
      "withdrawal",
      "withdrawals",
      "money out",
    ]),

    creditColumn: findHeader(headers, [
      "credit",
      "deposit",
      "deposits",
      "money in",
    ]),

    positiveMeaning: "income",
    dateFormat: "yyyy-mm-dd",

    merchantColumn: findHeader(headers, ["merchant", "payee", "payer"]),

    categoryColumn: findHeader(headers, ["category", "transaction category"]),

    notesColumn: findHeader(headers, [
      "notes",
      "note",
      "additional information",
    ]),
  };
}

export function prepareCsvRows(
  rows: CsvRawRow[],
  mapping: CsvColumnMapping,
): CsvPreparedRow[] {
  return rows.map((row, index) => {
    const clientErrors: string[] = [];

    const rawDate = row[mapping.dateColumn]?.trim() ?? "";

    const transactionDate = parseCsvDate(rawDate, mapping.dateFormat);

    if (!transactionDate) {
      clientErrors.push(`Invalid date: "${rawDate || "blank"}".`);
    }

    const description = row[mapping.descriptionColumn]?.trim() ?? "";

    if (!description) {
      clientErrors.push("Transaction description is missing.");
    }

    const amountResult =
      mapping.amountMode === "signed"
        ? parseSignedAmount(
            row[mapping.amountColumn] ?? "",
            mapping.positiveMeaning,
          )
        : parseDebitCreditAmount(
            row[mapping.debitColumn] ?? "",
            row[mapping.creditColumn] ?? "",
          );

    if (amountResult.error) {
      clientErrors.push(amountResult.error);
    }

    return {
      // CSV header is row 1.
      rowNumber: index + 2,

      transactionDate,
      description,

      amount: amountResult.amount,
      transactionKind: amountResult.transactionKind,

      merchant: getOptionalColumnValue(row, mapping.merchantColumn),

      categoryName: getOptionalColumnValue(row, mapping.categoryColumn),

      notes: getOptionalColumnValue(row, mapping.notesColumn),

      clientErrors,
    };
  });
}

function parseSignedAmount(
  value: string,
  positiveMeaning: "income" | "expense",
): {
  amount: number | null;
  transactionKind: "income" | "expense" | null;
  error?: string;
} {
  const parsed = parseMoney(value);

  if (parsed === null || parsed === 0) {
    return {
      amount: null,
      transactionKind: null,
      error: `Invalid amount: "${value.trim() || "blank"}".`,
    };
  }

  const isPositive = parsed > 0;

  const transactionKind =
    positiveMeaning === "income"
      ? isPositive
        ? "income"
        : "expense"
      : isPositive
        ? "expense"
        : "income";

  return {
    amount: Math.abs(parsed),
    transactionKind,
  };
}

function parseDebitCreditAmount(
  debitValue: string,
  creditValue: string,
): {
  amount: number | null;
  transactionKind: "income" | "expense" | null;
  error?: string;
} {
  const debit = parseMoney(debitValue);
  const credit = parseMoney(creditValue);

  const hasDebit = debit !== null && debit !== 0;

  const hasCredit = credit !== null && credit !== 0;

  if (hasDebit && hasCredit) {
    return {
      amount: null,
      transactionKind: null,
      error: "Both debit and credit contain amounts.",
    };
  }

  if (!hasDebit && !hasCredit) {
    return {
      amount: null,
      transactionKind: null,
      error: "Neither debit nor credit contains an amount.",
    };
  }

  if (hasDebit) {
    return {
      amount: Math.abs(debit),
      transactionKind: "expense",
    };
  }

  return {
    amount: Math.abs(credit as number),
    transactionKind: "income",
  };
}

function parseMoney(value: string): number | null {
  let normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const isParenthesized =
    normalized.startsWith("(") && normalized.endsWith(")");

  const hasTrailingMinus = normalized.endsWith("-");

  normalized = normalized
    .replace(/[()]/g, "")
    .replace(/-$/, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/[^0-9.-]/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (isParenthesized || hasTrailingMinus) {
    return -Math.abs(parsed);
  }

  return parsed;
}

function parseCsvDate(value: string, format: CsvDateFormat): string | null {
  if (!value.trim()) {
    return null;
  }

  const dateOnly = value.trim().split(/[T ]/)[0].replace(/\./g, "/");

  let year: number;
  let month: number;
  let day: number;

  if (format === "yyyy-mm-dd") {
    const parts = dateOnly.split("-");

    if (parts.length !== 3) {
      return null;
    }

    [year, month, day] = parts.map(Number);
  } else {
    const parts = dateOnly.split("/");

    if (parts.length !== 3) {
      return null;
    }

    const first = Number(parts[0]);
    const second = Number(parts[1]);
    const third = Number(parts[2]);

    year = third;

    if (format === "mm/dd/yyyy") {
      month = first;
      day = second;
    } else {
      day = first;
      month = second;
    }
  }

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function getOptionalColumnValue(row: CsvRawRow, column: string): string | null {
  if (!column) {
    return null;
  }

  const value = row[column]?.trim();

  return value || null;
}

function findHeader(headers: string[], candidates: string[]): string {
  for (const candidate of candidates) {
    const exactMatch = headers.find(
      (header) => normalizeHeader(header) === normalizeHeader(candidate),
    );

    if (exactMatch) {
      return exactMatch;
    }
  }

  for (const candidate of candidates) {
    const partialMatch = headers.find((header) =>
      normalizeHeader(header).includes(normalizeHeader(candidate)),
    );

    if (partialMatch) {
      return partialMatch;
    }
  }

  return "";
}

function hasMatchingHeader(headers: string[], candidates: string[]): boolean {
  return Boolean(findHeader(headers, candidates));
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}
