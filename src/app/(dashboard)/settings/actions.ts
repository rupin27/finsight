"use server";

import { revalidatePath } from "next/cache";

import type { AccountCurrency } from "@/features/accounts/account.types";
import type { SettingsActionState } from "@/features/settings/settings-action-state";
import {
  aiPreferencesSchema,
  financialPreferencesSchema,
  profileSettingsSchema,
} from "@/features/settings/settings-validation";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

function getString(formData: FormData, field: string): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

export async function updateProfileSettings(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = profileSettingsSchema.safeParse({
    fullName: getString(formData, "fullName"),
  });

  if (!parsed.success) {
    return {
      status: "error",

      message: "Please correct the profile details.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,

      full_name: parsed.data.fullName,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateSettingsPages();

  return {
    status: "success",
    message: "Profile settings saved.",
  };
}

export async function updateFinancialPreferences(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = financialPreferencesSchema.safeParse({
    defaultCurrency: getString(formData, "defaultCurrency"),

    timezone: getString(formData, "timezone"),

    dateFormat: getString(formData, "dateFormat"),
  });

  if (!parsed.success) {
    return {
      status: "error",

      message: "Please correct the financial preferences.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,

      default_currency: parsed.data.defaultCurrency,

      timezone: parsed.data.timezone,

      date_format: parsed.data.dateFormat,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateSettingsPages();

  return {
    status: "success",
    message: "Financial preferences saved.",
  };
}

export async function updateAiPreferences(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = aiPreferencesSchema.safeParse({
    aiEnabled: formData.get("aiEnabled") === "on",

    aiContextMode: getString(formData, "aiContextMode"),
  });

  if (!parsed.success) {
    return {
      status: "error",

      message: "Please correct the AI preferences.",

      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,

      ai_enabled: parsed.data.aiEnabled,

      ai_context_mode: parsed.data.aiContextMode,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidateSettingsPages();

  return {
    status: "success",
    message: parsed.data.aiEnabled
      ? "AI features enabled."
      : "AI features disabled.",
  };
}

/**
 * Retained for the existing
 * DisplayCurrencySelector component.
 */
export async function updateDefaultCurrency(currency: AccountCurrency) {
  const parsed =
    financialPreferencesSchema.shape.defaultCurrency.safeParse(currency);

  if (!parsed.success) {
    return {
      success: false,
      error: "The selected currency is invalid.",
    };
  }

  const { supabase, userId } = await requireAuthenticatedUser();

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,

      default_currency: parsed.data,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidateSettingsPages();

  return {
    success: true,
  };
}

function revalidateSettingsPages() {
  revalidatePath("/settings");
  revalidatePath("/overview");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/currency");
  revalidatePath("/projections");
  revalidatePath("/loans");
  revalidatePath("/goals");
  revalidatePath("/insights");
}
