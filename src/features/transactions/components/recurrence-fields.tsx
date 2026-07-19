"use client";

import { useState } from "react";
import { Repeat2 } from "lucide-react";

import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_FREQUENCY_LABELS,
  type RecurrenceFrequency,
  type TransactionRecord,
} from "@/features/transactions/transaction.types";
import type { TransactionFieldErrors } from "@/features/transactions/transaction-validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RecurrenceFieldsProps {
  defaultValues?: Partial<TransactionRecord>;
  fieldErrors?: TransactionFieldErrors;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/10";

export function RecurrenceFields({
  defaultValues,
  fieldErrors,
}: RecurrenceFieldsProps) {
  const [isRecurring, setIsRecurring] = useState(
    defaultValues?.isRecurring ?? false,
  );

  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>(
      defaultValues?.recurrenceFrequency ?? "monthly",
    );

  const defaultStartDate =
    defaultValues?.recurrenceStartDate ??
    defaultValues?.transactionDate ??
    getLocalDate();

  return (
    <div className="space-y-4 sm:col-span-2">
      <label className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
        <input
          type="checkbox"
          name="isRecurring"
          checked={isRecurring}
          onChange={(event) => {
            setIsRecurring(event.target.checked);
          }}
          className="mt-0.5 size-4 accent-cyan-300"
        />

        <span className="flex-1">
          <span className="flex items-center gap-2 text-sm font-medium text-white/70">
            <Repeat2 className="size-4 text-cyan-300" />
            Recurring transaction
          </span>

          <span className="mt-1 block text-xs leading-5 text-white/30">
            Include this transaction in future savings and cash-flow
            projections.
          </span>
        </span>
      </label>

      {isRecurring && (
        <div className="grid gap-5 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.025] p-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="recurrenceFrequency" className="text-white/65">
              Frequency
            </Label>

            <select
              id="recurrenceFrequency"
              name="recurrenceFrequency"
              value={recurrenceFrequency}
              onChange={(event) => {
                setRecurrenceFrequency(
                  event.target.value as RecurrenceFrequency,
                );
              }}
              className={cn(
                selectClassName,
                fieldErrors?.recurrenceFrequency?.length && "border-red-400/40",
              )}
            >
              {RECURRENCE_FREQUENCIES.map((frequency) => (
                <option
                  key={frequency}
                  value={frequency}
                  className="bg-[#0b0f17]"
                >
                  {RECURRENCE_FREQUENCY_LABELS[frequency]}
                </option>
              ))}
            </select>

            <FieldError errors={fieldErrors?.recurrenceFrequency} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrenceStartDate" className="text-white/65">
              Schedule start
            </Label>

            <Input
              id="recurrenceStartDate"
              name="recurrenceStartDate"
              type="date"
              defaultValue={defaultStartDate}
              required
              className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
            />

            <FieldError errors={fieldErrors?.recurrenceStartDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrenceEndDate" className="text-white/65">
              Schedule end
            </Label>

            <Input
              id="recurrenceEndDate"
              name="recurrenceEndDate"
              type="date"
              defaultValue={defaultValues?.recurrenceEndDate ?? ""}
              className="border-white/10 bg-white/[0.04] text-white [color-scheme:dark]"
            />

            <p className="text-xs text-white/25">
              Optional. Leave blank for an ongoing schedule.
            </p>

            <FieldError errors={fieldErrors?.recurrenceEndDate} />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-xs text-red-300">{errors[0]}</p>;
}

function getLocalDate(): string {
  const now = new Date();

  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}
