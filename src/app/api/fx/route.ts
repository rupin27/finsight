import { NextResponse } from "next/server";
import { z } from "zod";

import { ACCOUNT_CURRENCIES } from "@/features/accounts/account.types";
import type { FxConversionResponse } from "@/features/currency/currency.types";
import {
  calculateConversionRate,
  convertAmount,
  roundCurrencyAmount,
} from "@/lib/finance/currency-conversion";
import { getExchangeRateSnapshot } from "@/lib/finance/exchange-rates";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const querySchema = z.object({
  amount: z.coerce.number().finite().positive().max(1_000_000_000_000),

  from: z.enum(ACCOUNT_CURRENCIES),
  to: z.enum(ACCOUNT_CURRENCIES),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .refine(
      (date) => !date || date <= getTodayIso(),
      "The rate date cannot be in the future.",
    ),
});

export async function GET(request: Request) {
  try {
    return await handleGet(request);
  } catch (error) {
    console.error("[fx] Unhandled route error:", error);

    const response: FxConversionResponse = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected currency-conversion error occurred.",
    };

    return NextResponse.json(response, {
      status: 500,
    });
  }
}

async function handleGet(request: Request) {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || typeof claimsData?.claims.sub !== "string") {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in.",
      } satisfies FxConversionResponse,
      {
        status: 401,
      },
    );
  }

  const requestUrl = new URL(request.url);

  const parsed = querySchema.safeParse({
    amount: requestUrl.searchParams.get("amount"),

    from: requestUrl.searchParams.get("from"),

    to: requestUrl.searchParams.get("to"),

    date: requestUrl.searchParams.get("date") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,

        error:
          parsed.error.issues[0]?.message ??
          "The conversion request is invalid.",
      } satisfies FxConversionResponse,
      {
        status: 400,
      },
    );
  }

  const { amount, from, to, date } = parsed.data;

  const snapshot = await getExchangeRateSnapshot(from, date);

  const convertedAmount = roundCurrencyAmount(
    convertAmount(amount, from, to, snapshot),
  );

  const rate = calculateConversionRate(from, to, snapshot);

  return NextResponse.json({
    success: true,
    amount,
    convertedAmount,
    from,
    to,
    rate,
    effectiveDate: snapshot.effectiveDate,
    requestedDate: snapshot.requestedDate,
  } satisfies FxConversionResponse);
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
