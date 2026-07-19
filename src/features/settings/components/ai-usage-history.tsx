import { Activity, Bot } from "lucide-react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AiUsageEvent } from "@/features/settings/settings.types";
import { cn } from "@/lib/utils";

interface AiUsageHistoryProps {
  events: AiUsageEvent[];
  timezone: string;
}

export function AiUsageHistory({ events, timezone }: AiUsageHistoryProps) {
  return (
    <section
      aria-labelledby="ai-usage-history-heading"
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] p-5">
        <div className="flex items-center gap-2">
          <Activity aria-hidden="true" className="size-4 text-cyan-300" />

          <h2 id="ai-usage-history-heading" className="section-title">
            AI usage history
          </h2>
        </div>

        <p className="section-description">
          Metadata only. Conversation text is not stored in this history.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/10 text-violet-300">
            <Bot aria-hidden="true" className="size-5" />
          </div>

          <p className="mt-4 text-sm font-semibold text-white/55">
            No AI requests recorded
          </p>

          <p className="mt-1 text-xs leading-5 text-white/30">
            Usage metadata will appear here after you use Ask FinSight.
          </p>
        </div>
      ) : (
        <>
          <div role="list" className="space-y-3 p-4 md:hidden">
            {events.map((event) => (
              <UsageCard key={event.id} event={event} timezone={timezone} />
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableCaption className="sr-only">
                AI usage events showing request date, model, status, input
                tokens, output tokens, and total tokens.
              </TableCaption>

              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col">Date</TableHead>

                  <TableHead scope="col">Model</TableHead>

                  <TableHead scope="col">Status</TableHead>

                  <TableHead scope="col" className="text-right">
                    Input tokens
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Output tokens
                  </TableHead>

                  <TableHead scope="col" className="text-right">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-white/45">
                      <time dateTime={event.createdAt}>
                        {formatTimestamp(event.createdAt, timezone)}
                      </time>
                    </TableCell>

                    <TableCell>
                      <p className="whitespace-nowrap font-medium text-white/58">
                        {event.model}
                      </p>

                      {event.errorCode && (
                        <p className="mt-1 font-mono text-xs text-red-300/70">
                          {event.errorCode}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>

                    <TokenCell value={event.inputTokens} />

                    <TokenCell value={event.outputTokens} />

                    <TokenCell
                      value={event.totalTokens}
                      className="text-white/68"
                    />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function UsageCard({
  event,
  timezone,
}: {
  event: AiUsageEvent;
  timezone: string;
}) {
  return (
    <article
      role="listitem"
      className="rounded-xl border border-white/[0.07] bg-black/10 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            title={event.model}
            className="truncate text-sm font-semibold text-white/68"
          >
            {event.model}
          </p>

          <p className="mt-1 text-xs text-white/32">
            <time dateTime={event.createdAt}>
              {formatTimestamp(event.createdAt, timezone)}
            </time>
          </p>
        </div>

        <StatusBadge status={event.status} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4 text-xs">
        <UsageValue label="Input" value={formatNumber(event.inputTokens)} />

        <UsageValue label="Output" value={formatNumber(event.outputTokens)} />

        <UsageValue label="Total" value={formatNumber(event.totalTokens)} />
      </dl>

      {event.errorCode && (
        <p className="mt-3 font-mono text-xs leading-5 text-red-300/75">
          Error: {event.errorCode}
        </p>
      )}
    </article>
  );
}

function UsageValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-white/28">{label}</dt>

      <dd className="financial-number mt-1 font-semibold text-white/58">
        {value}
      </dd>
    </div>
  );
}

function TokenCell({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  return (
    <TableCell
      className={cn("financial-number text-right text-white/48", className)}
    >
      {formatNumber(value)}
    </TableCell>
  );
}

function StatusBadge({ status }: { status: AiUsageEvent["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        getStatusClassName(status),
      )}
    >
      {status}
    </span>
  );
}

function getStatusClassName(status: AiUsageEvent["status"]): string {
  if (status === "completed") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "failed") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-300";
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
