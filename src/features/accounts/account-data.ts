import type {
  Account,
  AccountCountry,
  AccountCurrency,
  AccountType,
} from "@/features/accounts/account.types";
import { requireAuthenticatedUser } from "@/lib/auth/require-authenticated-user";

export async function getAccounts(): Promise<Account[]> {
  const { supabase, userId } = await requireAuthenticatedUser();

  const { data, error } = await supabase
    .from("account_balances")
    .select(
      `
        id,
        name,
        institution,
        account_type,
        country,
        currency,
        opening_balance,
        opening_balance_date,
        current_balance,
        transaction_count,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("user_id", userId)
    .order("is_active", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(`Unable to load accounts: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),

    institution: typeof row.institution === "string" ? row.institution : null,

    accountType: row.account_type as AccountType,
    country: row.country as AccountCountry,
    currency: row.currency as AccountCurrency,

    openingBalance: Number(row.opening_balance ?? 0),

    openingBalanceDate: String(row.opening_balance_date),

    currentBalance: Number(row.current_balance ?? 0),

    transactionCount: Number(row.transaction_count ?? 0),

    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}
