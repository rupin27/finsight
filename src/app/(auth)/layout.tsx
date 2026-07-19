import { redirect } from "next/navigation";

import { FinSightLogo } from "@/components/brand/finsight-logo";
import { createClient } from "@/lib/supabase/server";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  if (claimsData?.claims) {
    redirect("/overview");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-cyan-500/10 blur-[130px]" />

        <div className="absolute -bottom-56 -right-40 size-[40rem] rounded-full bg-violet-500/10 blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_520px]">
        <section className="hidden flex-col justify-between px-12 py-10 lg:flex">
          <FinSightLogo />

          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-medium text-cyan-200">
              Your financial command center
            </div>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.04em]">
              See where your money is going—and where it can take you.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-white/50">
              Track accounts across India, the US and Ireland, understand your
              student loan, and build a clearer financial future.
            </p>
          </div>

          <p className="text-sm text-white/30">
            Private by design. Your financial records are protected by
            account-level data policies.
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center border-white/10 px-5 py-10 lg:border-l lg:bg-black/10">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <FinSightLogo />
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
