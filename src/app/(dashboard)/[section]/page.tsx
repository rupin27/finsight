import { notFound } from "next/navigation";
import {
  Bot,
  ChartNoAxesCombined,
  Goal,
  Landmark,
  ReceiptText,
  Settings,
  WalletCards,
} from "lucide-react";

const sections = {
  accounts: {
    title: "Accounts",
    description: "Manage your Indian, US and Irish accounts.",
    icon: WalletCards,
  },
  transactions: {
    title: "Transactions",
    description: "Record income and expenses or import a CSV.",
    icon: ReceiptText,
  },
  projections: {
    title: "Savings projections",
    description: "Project your future balance over a selected period.",
    icon: ChartNoAxesCombined,
  },
  loans: {
    title: "Student loan",
    description: "Track payments, payoff timing and remaining interest.",
    icon: Landmark,
  },
  goals: {
    title: "Financial goals",
    description: "Track savings, loan payoff and financial runway.",
    icon: Goal,
  },
  insights: {
    title: "Financial coach",
    description: "Receive explainable guidance based on your data.",
    icon: Bot,
  },
  settings: {
    title: "Settings",
    description: "Manage currency, timezone and application preferences.",
    icon: Settings,
  },
} as const;

interface SectionPageProps {
  params: Promise<{
    section: string;
  }>;
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;

  const sectionDetails = sections[section as keyof typeof sections];

  if (!sectionDetails) {
    notFound();
  }

  const Icon = sectionDetails.icon;

  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07]">
        <Icon className="size-5 text-cyan-300" />
      </div>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        {sectionDetails.title}
      </h1>

      <p className="mt-2 text-white/40">{sectionDetails.description}</p>

      <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center">
        <p className="text-sm font-medium text-white/60">
          This module is coming next
        </p>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/30">
          The application foundation is active. We will replace this screen with
          the complete feature implementation.
        </p>
      </div>
    </div>
  );
}
