import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { createClient } from "@/lib/supabase/server";

interface DashboardLayoutProps {
  children: ReactNode;
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
    <div className="min-h-dvh bg-[#07090e] text-white">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <AppSidebar email={email} />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-dvh outline-none lg:pl-72"
      >
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
