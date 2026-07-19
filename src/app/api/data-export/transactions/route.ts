import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TransactionExportColumn =
  | "id"
  | "created_at"
  | "amount"
  | "currency"
  | "transaction_date"
  | "description"
  | "category_id"
  | "transaction_kind"
  | "merchant"
  | "account_id"
  | "destination_account_id"
  | "is_recurring"
  | "recurrence_frequency"
  | "recurrence_start_date"
  | "recurrence_end_date";

type TransactionExportRow = Record<TransactionExportColumn, unknown>;

const CSV_HEADERS = [
  "id",
  "transaction_date",
  "transaction_kind",
  "description",
  "merchant",
  "amount",
  "currency",
  "account_id",
  "destination_account_id",
  "category_id",
  "is_recurring",
  "recurrence_frequency",
  "recurrence_start_date",
  "recurrence_end_date",
  "created_at",
] as const satisfies readonly TransactionExportColumn[];

const TRANSACTION_EXPORT_SELECT = `
  id,
  transaction_date,
  transaction_kind,
  description,
  merchant,
  amount,
  currency,
  account_id,
  destination_account_id,
  category_id,
  is_recurring,
  recurrence_frequency,
  recurrence_start_date,
  recurrence_end_date,
  created_at
`;

export async function GET() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  const user = userData.user;

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "You must be signed in.",
      },
      {
        status: 401,
      },
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_EXPORT_SELECT)
    .eq("user_id", user.id)
    .order("transaction_date", {
      ascending: false,
    });

  if (error) {
    return NextResponse.json(
      {
        error: `Unable to export transactions: ${error.message}`,
      },
      {
        status: 500,
      },
    );
  }

  /*
   * The selected query is fixed above and
   * contains every TransactionExportColumn.
   */
  const rows = (data ?? []) as unknown as TransactionExportRow[];

  const csvLines = [
    CSV_HEADERS.join(","),

    ...rows.map((row) =>
      CSV_HEADERS.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ];

  const today = new Date().toISOString().slice(0, 10);

  return new Response(`\uFEFF${csvLines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",

      "Content-Disposition": `attachment; filename="finsight-transactions-${today}.csv"`,

      "Cache-Control": "private, no-store, max-age=0",

      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let text = String(value);

  /*
   * Prevent spreadsheet applications from
   * interpreting user-controlled text as a
   * formula.
   */
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  const escaped = text.replaceAll('"', '""');

  return `"${escaped}"`;
}
