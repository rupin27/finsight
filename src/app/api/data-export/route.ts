import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const userId = user.id;

  const [preferences, accounts, transactions, loanProfiles, goals, aiUsage] =
    await Promise.all([
      fetchUserRows(supabase, "user_preferences", userId),

      fetchUserRows(supabase, "accounts", userId),

      fetchUserRows(supabase, "transactions", userId),

      fetchUserRows(supabase, "loan_profiles", userId),

      fetchUserRows(supabase, "financial_goal_plans", userId),

      fetchUserRows(supabase, "ai_usage_events", userId),
    ]);

  const exportedAt = new Date().toISOString();

  const exportData = {
    exportVersion: 1,
    exportedAt,

    account: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      providers: user.app_metadata?.providers ?? [],
    },

    preferences,
    accounts,
    transactions,
    loanProfiles,
    financialGoals: goals,

    aiUsageMetadata: aiUsage.map(sanitizeAiUsageRow),
  };

  const filename = `finsight-data-${exportedAt.slice(0, 10)}.json`;

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,

    headers: {
      "Content-Type": "application/json; charset=utf-8",

      "Content-Disposition": `attachment; filename="${filename}"`,

      "Cache-Control": "private, no-store, max-age=0",

      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function fetchUserRows(
  supabase: Awaited<ReturnType<typeof createClient>>,

  table: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to export ${table}: ${error.message}`);
  }

  return data ?? [];
}

function sanitizeAiUsageRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    model: row.model,
    status: row.status,

    promptCharacters: row.prompt_characters,

    responseCharacters: row.response_characters,

    inputTokens: row.input_tokens,

    outputTokens: row.output_tokens,

    totalTokens: row.total_tokens,

    errorCode: row.error_code,

    createdAt: row.created_at,
  };
}
