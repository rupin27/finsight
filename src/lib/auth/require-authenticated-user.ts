import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser() {
  const supabase = await createClient();

  const { data: claimsData, error } = await supabase.auth.getClaims();

  const userId = claimsData?.claims.sub;

  if (error || typeof userId !== "string") {
    redirect("/login");
  }

  return {
    supabase,
    userId,
  };
}
