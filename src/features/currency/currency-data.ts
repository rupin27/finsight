import {
  ACCOUNT_CURRENCIES,
  type AccountCurrency,
} from "@/features/accounts/account.types";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function getUserDefaultCurrency(): Promise<AccountCurrency> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("default_currency")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load currency preferences: ${error.message}`);
  }

  const currency = data?.default_currency;

  if (
    typeof currency === "string" &&
    ACCOUNT_CURRENCIES.includes(currency as AccountCurrency)
  ) {
    return currency as AccountCurrency;
  }

  return "USD";
}
