"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  Bot,
  ChartNoAxesCombined,
  Goal,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  WalletCards,
} from "lucide-react";

import { signOut } from "@/app/(dashboard)/actions";
import { FinSightLogo } from "@/components/brand/finsight-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <aside
        aria-label="Primary application navigation"
        className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.07] bg-[#080b11]/95 px-4 py-5 shadow-[18px_0_55px_rgba(0,0,0,0.16)] backdrop-blur-2xl lg:flex"
      >
        <SidebarContent email={email} pathname={pathname} />
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080b11]/90 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-2xl lg:hidden">
        <div className="flex min-h-11 items-center justify-between gap-4">
          <FinSightLogo />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="border-white/10 bg-white/[0.035] text-white/70 hover:bg-white/[0.07] hover:text-white"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-[min(22rem,calc(100vw-1rem))] border-white/[0.08] bg-[#080b11]/98 p-0 shadow-2xl shadow-black/40 backdrop-blur-2xl"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>FinSight navigation</SheetTitle>

                <SheetDescription>
                  Navigate between your financial dashboard sections.
                </SheetDescription>
              </SheetHeader>

              <div className="flex min-h-dvh flex-col px-4 py-5">
                <SidebarContent
                  email={email}
                  pathname={pathname}
                  onNavigate={() => {
                    setMobileOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}

function SidebarContent({
  email,
  pathname,
  onNavigate,
}: {
  email: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const initial = email.trim().charAt(0).toUpperCase() || "A";

  const settingsActive = isRouteActive(pathname, "/settings");

  return (
    <>
      <div className="px-2">
        <Link
          href="/overview"
          onClick={onNavigate}
          aria-label="Go to FinSight overview"
          className="inline-flex rounded-xl focus-visible:outline-none"
        >
          <FinSightLogo />
        </Link>
      </div>

      <nav aria-label="Workspace" className="mt-9 flex-1">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/25">
          Workspace
        </p>

        <div className="space-y-1">
          {navigationItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              active={isRouteActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      <div className="mt-6 space-y-3 border-t border-white/[0.07] pt-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",

            settingsActive
              ? "bg-white/[0.08] text-white"
              : "text-white/50 hover:bg-white/[0.05] hover:text-white/90",
          )}
        >
          <Settings
            className={cn(
              "size-[18px]",

              settingsActive
                ? "text-cyan-300"
                : "text-white/35 group-hover:text-white/70",
            )}
          />
          Settings
        </Link>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 shadow-lg shadow-black/10">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-400/10 text-sm font-semibold text-violet-200"
            >
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-white/80">
                Personal account
              </p>

              <p
                title={email}
                className="mt-0.5 truncate text-xs text-white/35"
              >
                {email}
              </p>
            </div>
          </div>

          <form action={signOut} className="mt-3">
            <Button
              type="submit"
              variant="outline"
              className="w-full border-white/[0.08] bg-white/[0.02] text-xs text-white/50 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

function NavigationLink({
  item,
  active,
  onNavigate,
}: {
  item: NavigationItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[color,background-color,box-shadow,transform] duration-200",

        active
          ? "bg-cyan-300 text-slate-950 shadow-[0_10px_30px_rgba(103,232,249,0.13)]"
          : "text-white/48 hover:bg-white/[0.05] hover:text-white/90",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] transition-colors",

          active ? "text-slate-950" : "text-white/35 group-hover:text-white/75",
        )}
      />

      <span>{item.label}</span>

      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-slate-950/45"
        />
      )}
    </Link>
  );
}

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
