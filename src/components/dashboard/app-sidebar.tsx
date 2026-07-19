"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  ChartNoAxesCombined,
  CreditCard,
  ArrowRightLeft,
  Goal,
  Landmark,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Settings,
  WalletCards,
} from "lucide-react";

import { signOut } from "@/app/(dashboard)/actions";
import { FinSightLogo } from "@/components/brand/finsight-logo";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: WalletCards,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ReceiptText,
  },
  {
    label: "Currency",
    href: "/currency",
    icon: ArrowRightLeft,
  },
  {
    label: "Projections",
    href: "/projections",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Student loan",
    href: "/loans",
    icon: Landmark,
  },
  {
    label: "Goals",
    href: "/goals",
    icon: Goal,
  },
  {
    label: "AI coach",
    href: "/insights",
    icon: Bot,
  },
];

interface AppSidebarProps {
  email: string;
}

export function AppSidebar({ email }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.07] bg-[#080b11]/95 px-4 py-5 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <FinSightLogo />
        </div>

        <nav className="mt-10 flex-1 space-y-1">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
            Workspace
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-cyan-300 text-slate-950 shadow-[0_10px_30px_rgba(103,232,249,0.12)]"
                    : "text-white/45 hover:bg-white/[0.045] hover:text-white/85",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px]",
                    isActive
                      ? "text-slate-950"
                      : "text-white/35 group-hover:text-white/70",
                  )}
                />

                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/[0.07] pt-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition-colors hover:bg-white/[0.045] hover:text-white/85"
          >
            <Settings className="size-[18px] text-white/35" />
            Settings
          </Link>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-xs font-semibold text-violet-200">
                {email.slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/75">
                  Personal account
                </p>

                <p className="truncate text-xs text-white/30">{email}</p>
              </div>
            </div>

            <form action={signOut} className="mt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] px-3 py-2 text-xs font-medium text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/80"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080b11]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <FinSightLogo />

          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-400/10 text-xs font-semibold text-violet-200">
            {email.slice(0, 1).toUpperCase()}
          </div>
        </div>

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs",
                  isActive
                    ? "bg-cyan-300 text-slate-950"
                    : "bg-white/[0.04] text-white/45",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
