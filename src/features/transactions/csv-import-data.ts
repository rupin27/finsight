import type { CsvImportRecord } from "@/features/transactions/csv-import.types";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function getRecentCsvImports(
  limit = 5,
): Promise<CsvImportRecord[]> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const safeLimit = Math.min(Math.max(limit, 1), 20);

  const { data, error } = await supabase
    .from("csv_imports")
    .select(
      `
          id,
          account_id,
          filename,
          file_size_bytes,
          total_rows,
          imported_rows,
          duplicate_rows,
          invalid_rows,
          status,
          error_message,
          created_at
        `,
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Unable to load CSV import history: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),

    accountId: typeof row.account_id === "string" ? row.account_id : null,

    filename: String(row.filename),

    fileSizeBytes: Number(row.file_size_bytes ?? 0),

    totalRows: Number(row.total_rows ?? 0),

    importedRows: Number(row.imported_rows ?? 0),

    duplicateRows: Number(row.duplicate_rows ?? 0),

    invalidRows: Number(row.invalid_rows ?? 0),

    status: row.status === "failed" ? "failed" : "completed",

    errorMessage:
      typeof row.error_message === "string" ? row.error_message : null,

    createdAt: String(row.created_at),
  }));
}
