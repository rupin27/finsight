import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { createClient } from "@/lib/supabase/server";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();

  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims) {
    redirect("/login");
  }

  const emailClaim = claimsData.claims.email;

  const email = typeof emailClaim === "string" ? emailClaim : "Account";

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <AppSidebar email={email} />

      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
