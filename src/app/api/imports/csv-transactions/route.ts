import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import type {
  CsvImportSummary,
  CsvPreviewRow,
} from "@/features/transactions/csv-import.types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MAX_ROWS = 500;

const preparedRowSchema = z.object({
  rowNumber: z.number().int().positive(),

  transactionDate: z.string().nullable(),

  description: z.string(),

  amount: z.number().finite().nullable(),

  transactionKind: z.enum(["income", "expense"]).nullable(),

  merchant: z.string().nullable(),
  categoryName: z.string().nullable(),
  notes: z.string().nullable(),

  clientErrors: z.array(z.string()).max(20),
});

const importRequestSchema = z.object({
  mode: z.enum(["preview", "commit"]),

  filename: z.string().trim().min(1).max(255),

  fileSizeBytes: z.number().int().nonnegative().max(MAX_FILE_SIZE_BYTES),

  accountId: z.string().uuid(),

  incomeFallbackCategoryId: z.string().uuid(),

  expenseFallbackCategoryId: z.string().uuid(),

  rows: z.array(preparedRowSchema).min(1).max(MAX_ROWS),
});

interface ImportableTransaction {
  user_id: string;
  account_id: string;

  destination_account_id: null;
  category_id: string;

  transaction_kind: "income" | "expense";

  amount: number;
  currency: string;
  transaction_date: string;

  description: string;
  merchant: string | null;
  notes: string | null;

  is_recurring: false;

  import_source: string;
  source_row_hash: string;
}

interface PreparedImport {
  previewRows: CsvPreviewRow[];
  insertRows: ImportableTransaction[];
  summary: CsvImportSummary;
  currency: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims.sub;

  if (claimsError || typeof userId !== "string") {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in.",
      },
      {
        status: 401,
      },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "The import request is not valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = importRequestSchema.safeParse(requestBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error:
          parsed.error.issues[0]?.message ?? "The import request is invalid.",
      },
      {
        status: 400,
      },
    );
  }

  const {
    mode,
    filename,
    fileSizeBytes,
    accountId,
    incomeFallbackCategoryId,
    expenseFallbackCategoryId,
    rows,
  } = parsed.data;

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select(
      `
          id,
          account_type,
          currency,
          is_active
        `,
    )
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError || !account) {
    return NextResponse.json(
      {
        success: false,
        error: "The selected account was not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (!account.is_active) {
    return NextResponse.json(
      {
        success: false,
        error: "Transactions cannot be imported into an inactive account.",
      },
      {
        status: 400,
      },
    );
  }

  if (account.account_type === "loan") {
    return NextResponse.json(
      {
        success: false,
        error: "CSV files must be imported into a bank or cash account.",
      },
      {
        status: 400,
      },
    );
  }

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select(
      `
          id,
          name,
          kind
        `,
    )
    .eq("user_id", userId);

  if (categoryError) {
    return NextResponse.json(
      {
        success: false,
        error: "FinSight could not load your transaction categories.",
      },
      {
        status: 500,
      },
    );
  }

  const incomeFallback = categories?.find(
    (category) =>
      category.id === incomeFallbackCategoryId && category.kind === "income",
  );

  const expenseFallback = categories?.find(
    (category) =>
      category.id === expenseFallbackCategoryId && category.kind === "expense",
  );

  if (!incomeFallback || !expenseFallback) {
    return NextResponse.json(
      {
        success: false,
        error: "Select valid fallback income and expense categories.",
      },
      {
        status: 400,
      },
    );
  }

  const preparedImport = await prepareImport({
    supabase,
    userId,
    accountId,
    currency: String(account.currency),
    filename,
    rows,
    categories: categories ?? [],
    incomeFallbackCategoryId,
    expenseFallbackCategoryId,
  });

  if (mode === "preview") {
    return NextResponse.json({
      success: true,
      currency: preparedImport.currency,
      previewRows: preparedImport.previewRows,
      summary: preparedImport.summary,
    });
  }

  if (preparedImport.insertRows.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "There are no valid, non-duplicate rows to import.",
        currency: preparedImport.currency,
        previewRows: preparedImport.previewRows,
        summary: preparedImport.summary,
      },
      {
        status: 422,
      },
    );
  }

  const { error: insertError } = await supabase
    .from("transactions")
    .insert(preparedImport.insertRows);

  if (insertError) {
    await supabase.from("csv_imports").insert({
      user_id: userId,
      account_id: accountId,
      filename,
      file_size_bytes: fileSizeBytes,
      total_rows: preparedImport.summary.totalRows,
      imported_rows: 0,
      duplicate_rows: preparedImport.summary.duplicateRows,
      invalid_rows: preparedImport.summary.invalidRows,
      status: "failed",
      error_message: insertError.message,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          insertError.code === "23505"
            ? "A duplicate was added after the preview. Preview the file again before importing."
            : insertError.message,
      },
      {
        status: 500,
      },
    );
  }

  const importedRows = preparedImport.insertRows.length;

  const { error: historyError } = await supabase.from("csv_imports").insert({
    user_id: userId,
    account_id: accountId,
    filename,
    file_size_bytes: fileSizeBytes,

    total_rows: preparedImport.summary.totalRows,

    imported_rows: importedRows,

    duplicate_rows: preparedImport.summary.duplicateRows,

    invalid_rows: preparedImport.summary.invalidRows,

    status: "completed",
    error_message: null,
  });

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/overview");
  revalidatePath("/projections");
  revalidatePath("/goals");
  revalidatePath("/insights");

  return NextResponse.json({
    success: true,

    message: historyError
      ? `${importedRows} transactions were imported, but the import-history record could not be saved.`
      : `${importedRows} transactions imported successfully.`,

    currency: preparedImport.currency,

    previewRows: preparedImport.previewRows,

    summary: {
      ...preparedImport.summary,
      importedRows,
    },
  });
}

interface PrepareImportOptions {
  supabase: Awaited<ReturnType<typeof createClient>>;

  userId: string;
  accountId: string;
  currency: string;
  filename: string;

  rows: z.infer<typeof preparedRowSchema>[];

  categories: Array<{
    id: string;
    name: string;
    kind: string;
  }>;

  incomeFallbackCategoryId: string;
  expenseFallbackCategoryId: string;
}

async function prepareImport({
  supabase,
  userId,
  accountId,
  currency,
  filename,
  rows,
  categories,
  incomeFallbackCategoryId,
  expenseFallbackCategoryId,
}: PrepareImportOptions): Promise<PreparedImport> {
  const categoryMap = new Map<
    string,
    {
      id: string;
      name: string;
    }
  >();

  for (const category of categories) {
    categoryMap.set(createCategoryKey(category.kind, category.name), {
      id: category.id,
      name: category.name,
    });
  }

  const drafts = rows.map((row) => {
    const errors = [...row.clientErrors];

    const warnings: string[] = [];

    if (!row.transactionDate || !isValidIsoDate(row.transactionDate)) {
      errors.push("The transaction date is invalid.");
    } else if (row.transactionDate > getTodayIso()) {
      errors.push("Future transactions cannot be imported.");
    }

    const description = row.description.trim();

    if (description.length < 2 || description.length > 160) {
      errors.push("Description must contain between 2 and 160 characters.");
    }

    if (
      row.amount === null ||
      !Number.isFinite(row.amount) ||
      row.amount <= 0
    ) {
      errors.push("The transaction amount must be greater than zero.");
    }

    if (row.transactionKind !== "income" && row.transactionKind !== "expense") {
      errors.push("The transaction type is invalid.");
    }

    const kind = row.transactionKind;

    const fallbackCategoryId =
      kind === "income" ? incomeFallbackCategoryId : expenseFallbackCategoryId;

    let selectedCategory:
      | {
          id: string;
          name: string;
        }
      | undefined;

    if (row.categoryName && kind) {
      selectedCategory = categoryMap.get(
        createCategoryKey(kind, row.categoryName),
      );

      if (!selectedCategory) {
        warnings.push(
          `Category "${row.categoryName}" was not found. The fallback category will be used.`,
        );
      }
    }

    if (!selectedCategory && kind) {
      selectedCategory = categories
        .filter((category) => category.kind === kind)
        .map((category) => ({
          id: category.id,
          name: category.name,
        }))
        .find((category) => category.id === fallbackCategoryId);
    }

    if (!selectedCategory) {
      errors.push("A valid transaction category could not be selected.");
    }

    const amount = row.amount === null ? null : Number(row.amount.toFixed(2));

    const sourceRowHash =
      errors.length === 0 && row.transactionDate && kind && amount !== null
        ? createTransactionHash({
            accountId,
            transactionDate: row.transactionDate,
            transactionKind: kind,
            amount,
            description,
            merchant: row.merchant ?? "",
          })
        : null;

    return {
      row,
      errors,
      warnings,
      description,
      amount,
      kind,
      selectedCategory,
      sourceRowHash,
    };
  });

  const candidateHashes = drafts
    .map((draft) => draft.sourceRowHash)
    .filter((hash): hash is string => typeof hash === "string");

  const existingHashes = await getExistingHashes(
    supabase,
    userId,
    candidateHashes,
  );

  const seenInFile = new Set<string>();

  const previewRows: CsvPreviewRow[] = [];
  const insertRows: ImportableTransaction[] = [];

  for (const draft of drafts) {
    let status: "ready" | "duplicate" | "invalid";

    if (
      draft.errors.length > 0 ||
      !draft.sourceRowHash ||
      !draft.selectedCategory ||
      !draft.kind ||
      draft.amount === null ||
      !draft.row.transactionDate
    ) {
      status = "invalid";
    } else if (
      existingHashes.has(draft.sourceRowHash) ||
      seenInFile.has(draft.sourceRowHash)
    ) {
      status = "duplicate";
    } else {
      status = "ready";
    }

    if (draft.sourceRowHash) {
      seenInFile.add(draft.sourceRowHash);
    }

    previewRows.push({
      rowNumber: draft.row.rowNumber,

      transactionDate: draft.row.transactionDate,

      description: draft.description,

      amount: draft.amount,
      transactionKind: draft.kind,

      merchant: draft.row.merchant,

      categoryName: draft.selectedCategory?.name ?? draft.row.categoryName,

      status,

      errors: draft.errors,
      warnings: draft.warnings,
    });

    if (
      status === "ready" &&
      draft.sourceRowHash &&
      draft.selectedCategory &&
      draft.kind &&
      draft.amount !== null &&
      draft.row.transactionDate
    ) {
      insertRows.push({
        user_id: userId,
        account_id: accountId,

        destination_account_id: null,

        category_id: draft.selectedCategory.id,

        transaction_kind: draft.kind,

        amount: draft.amount,
        currency,

        transaction_date: draft.row.transactionDate,

        description: draft.description,

        merchant: normalizeOptionalText(draft.row.merchant, 100),

        notes: normalizeOptionalText(draft.row.notes, 500),

        is_recurring: false,

        import_source: `csv:${filename.slice(0, 240)}`,

        source_row_hash: draft.sourceRowHash,
      });
    }
  }

  const summary: CsvImportSummary = {
    totalRows: previewRows.length,

    readyRows: previewRows.filter((row) => row.status === "ready").length,

    duplicateRows: previewRows.filter((row) => row.status === "duplicate")
      .length,

    invalidRows: previewRows.filter((row) => row.status === "invalid").length,
  };

  return {
    previewRows,
    insertRows,
    summary,
    currency,
  };
}

async function getExistingHashes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  hashes: string[],
): Promise<Set<string>> {
  const existingHashes = new Set<string>();

  for (let index = 0; index < hashes.length; index += 100) {
    const hashChunk = hashes.slice(index, index + 100);

    if (hashChunk.length === 0) {
      continue;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("source_row_hash")
      .eq("user_id", userId)
      .in("source_row_hash", hashChunk);

    if (error) {
      throw new Error(
        `Unable to check duplicate transactions: ${error.message}`,
      );
    }

    for (const row of data ?? []) {
      if (typeof row.source_row_hash === "string") {
        existingHashes.add(row.source_row_hash);
      }
    }
  }

  return existingHashes;
}

function createTransactionHash({
  accountId,
  transactionDate,
  transactionKind,
  amount,
  description,
  merchant,
}: {
  accountId: string;
  transactionDate: string;
  transactionKind: string;
  amount: number;
  description: string;
  merchant: string;
}): string {
  const canonicalValue = [
    accountId,
    transactionDate,
    transactionKind,
    amount.toFixed(2),
    normalizeHashText(description),
    normalizeHashText(merchant),
  ].join("|");

  return createHash("sha256").update(canonicalValue).digest("hex");
}

function createCategoryKey(kind: string, name: string): string {
  return `${kind}:${normalizeHashText(name)}`;
}

function normalizeHashText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeOptionalText(
  value: string | null,
  maxLength: number,
): string | null {
  const normalized = value?.trim().slice(0, maxLength);

  return normalized || null;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
