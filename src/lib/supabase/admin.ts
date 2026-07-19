import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured.");
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,

        persistSession: false,

        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}
