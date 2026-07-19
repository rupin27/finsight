import type { AccountCurrency } from "@/features/accounts/account.types";
import type {
  AiContextMode,
  AiUsageEvent,
  SettingsPageData,
  SupportedDateFormat,
  SupportedTimeZone,
  UserPreferences,
} from "@/features/settings/settings.types";
import {
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_TIME_ZONES,
} from "@/features/settings/settings.types";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unable to load the authenticated user.");
  }

  const user = userData.user;

  const [
    preferenceResult,
    usageResult,
    accountCountResult,
    transactionCountResult,
    loanProfileCountResult,
    goalCountResult,
    aiCountResult,
  ] = await Promise.all([
    supabase
      .from("user_preferences")
      .select(
        `
          full_name,
          default_currency,
          timezone,
          date_format,
          ai_enabled,
          ai_context_mode
        `,
      )
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("ai_usage_events")
      .select(
        `
          id,
          model,
          status,
          prompt_characters,
          response_characters,
          input_tokens,
          output_tokens,
          total_tokens,
          error_code,
          created_at
        `,
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(20),

    countRows(supabase, "accounts", userId),

    countRows(supabase, "transactions", userId),

    countRows(supabase, "loan_profiles", userId),

    countRows(supabase, "financial_goal_plans", userId),

    countRows(supabase, "ai_usage_events", userId),
  ]);

  if (preferenceResult.error) {
    throw new Error(
      `Unable to load preferences: ${preferenceResult.error.message}`,
    );
  }

  if (usageResult.error) {
    throw new Error(`Unable to load AI usage: ${usageResult.error.message}`);
  }

  const preferences = mapPreferences(preferenceResult.data);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();

  const { count: recentAiCount } = await supabase
    .from("ai_usage_events")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .in("status", ["started", "completed"])
    .gte("created_at", since);

  const providers = getAuthProviders(user);

  return {
    email: user.email ?? "Unavailable",

    userId,

    accountCreatedAt: user.created_at ?? null,

    lastSignInAt: user.last_sign_in_at ?? null,

    authProviders: providers,

    usesPasswordAuthentication: providers.includes("email"),

    preferences,

    aiUsage: (usageResult.data ?? []).map(mapAiUsageEvent),

    aiRequestsLast24Hours: recentAiCount ?? 0,

    aiDailyLimit: getAiDailyLimit(),

    dataCounts: {
      accounts: accountCountResult,

      transactions: transactionCountResult,

      loanProfiles: loanProfileCountResult,

      financialGoals: goalCountResult,

      aiRequests: aiCountResult,
    },
  };
}

function mapPreferences(row: Record<string, unknown> | null): UserPreferences {
  const timezone =
    typeof row?.timezone === "string" &&
    SUPPORTED_TIME_ZONES.includes(row.timezone as SupportedTimeZone)
      ? (row.timezone as SupportedTimeZone)
      : "UTC";

  const dateFormat =
    typeof row?.date_format === "string" &&
    SUPPORTED_DATE_FORMATS.includes(row.date_format as SupportedDateFormat)
      ? (row.date_format as SupportedDateFormat)
      : "MMM d, yyyy";

  return {
    fullName: typeof row?.full_name === "string" ? row.full_name : null,

    defaultCurrency: (row?.default_currency ?? "USD") as AccountCurrency,

    timezone,

    dateFormat,

    aiEnabled: typeof row?.ai_enabled === "boolean" ? row.ai_enabled : true,

    aiContextMode: (row?.ai_context_mode ?? "aggregated") as AiContextMode,
  };
}

function mapAiUsageEvent(row: Record<string, unknown>): AiUsageEvent {
  return {
    id: String(row.id),

    model: String(row.model),

    status: row.status as AiUsageEvent["status"],

    promptCharacters: Number(row.prompt_characters ?? 0),

    responseCharacters: Number(row.response_characters ?? 0),

    inputTokens: row.input_tokens === null ? null : Number(row.input_tokens),

    outputTokens: row.output_tokens === null ? null : Number(row.output_tokens),

    totalTokens: row.total_tokens === null ? null : Number(row.total_tokens),

    errorCode: typeof row.error_code === "string" ? row.error_code : null,

    createdAt: String(row.created_at),
  };
}

async function countRows(
  supabase: Awaited<ReturnType<typeof requireAuthenticatedUser>>["supabase"],

  table: string,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to count ${table}: ${error.message}`);
  }

  return count ?? 0;
}

function getAuthProviders(user: {
  app_metadata?: {
    provider?: unknown;
    providers?: unknown;
  };

  identities?: Array<{
    provider?: string;
  }> | null;
}): string[] {
  const providers = new Set<string>();

  const appProviders = user.app_metadata?.providers;

  if (Array.isArray(appProviders)) {
    for (const provider of appProviders) {
      if (typeof provider === "string") {
        providers.add(provider);
      }
    }
  }

  if (typeof user.app_metadata?.provider === "string") {
    providers.add(user.app_metadata.provider);
  }

  for (const identity of user.identities ?? []) {
    if (identity.provider) {
      providers.add(identity.provider);
    }
  }

  return [...providers];
}

function getAiDailyLimit(): number {
  const parsed = Number(process.env.FINSIGHT_AI_DAILY_LIMIT ?? 20);

  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.max(1, Math.min(200, Math.floor(parsed)));
}
