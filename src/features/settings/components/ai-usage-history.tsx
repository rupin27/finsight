import { Activity } from "lucide-react";

import type { AiUsageEvent } from "@/features/settings/settings.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AiUsageHistoryProps {
  events: AiUsageEvent[];
  timezone: string;
}

export function AiUsageHistory({ events, timezone }: AiUsageHistoryProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-cyan-300" />

          <h2 className="font-medium text-white">AI usage history</h2>
        </div>

        <p className="mt-2 text-sm text-white/35">
          Metadata only. Conversation text is not stored in this table.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-white/35">
          No AI requests recorded.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.07] hover:bg-transparent">
                <TableHead className="text-white/35">Date</TableHead>

                <TableHead className="text-white/35">Model</TableHead>

                <TableHead className="text-white/35">Status</TableHead>

                <TableHead className="text-right text-white/35">
                  Input tokens
                </TableHead>

                <TableHead className="text-right text-white/35">
                  Output tokens
                </TableHead>

                <TableHead className="text-right text-white/35">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  className="border-white/[0.055] hover:bg-white/[0.025]"
                >
                  <TableCell className="whitespace-nowrap text-white/45">
                    {formatTimestamp(event.createdAt, timezone)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-white/55">
                    {event.model}
                  </TableCell>

                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        getStatusClassName(event.status),
                      )}
                    >
                      {event.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-right text-white/45">
                    {formatNumber(event.inputTokens)}
                  </TableCell>

                  <TableCell className="text-right text-white/45">
                    {formatNumber(event.outputTokens)}
                  </TableCell>

                  <TableCell className="text-right text-white/60">
                    {formatNumber(event.totalTokens)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function getStatusClassName(status: AiUsageEvent["status"]): string {
  if (status === "completed") {
    return "bg-emerald-400/10 text-emerald-300";
  }

  if (status === "failed") {
    return "bg-red-400/10 text-red-300";
  }

  return "bg-amber-400/10 text-amber-300";
}

function formatNumber(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatTimestamp(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}
