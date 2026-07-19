import type { UserPreferences } from "@/features/settings/settings.types";
import {
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_TIME_ZONES,
} from "@/features/settings/settings.types";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function getUserPreferences(): Promise<UserPreferences> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
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
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load user preferences: ${error.message}`);
  }

  const timezone =
    typeof data?.timezone === "string" &&
    SUPPORTED_TIME_ZONES.includes(data.timezone as never)
      ? data.timezone
      : "UTC";

  const dateFormat =
    typeof data?.date_format === "string" &&
    SUPPORTED_DATE_FORMATS.includes(data.date_format as never)
      ? data.date_format
      : "MMM d, yyyy";

  return {
    fullName: typeof data?.full_name === "string" ? data.full_name : null,

    defaultCurrency: data?.default_currency ?? "USD",

    timezone: timezone as UserPreferences["timezone"],

    dateFormat: dateFormat as UserPreferences["dateFormat"],

    aiEnabled: typeof data?.ai_enabled === "boolean" ? data.ai_enabled : true,

    aiContextMode:
      data?.ai_context_mode === "disabled" ? "disabled" : "aggregated",
  };
}
