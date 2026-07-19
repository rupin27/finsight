import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildFinancialCoachInput,
  FINANCIAL_COACH_INSTRUCTIONS,
} from "@/features/insights/financial-coach-context";
import { getInsightsDashboardData } from "@/features/insights/insight-data";
import type {
  FinancialCoachApiResponse,
  FinancialCoachMessage,
} from "@/features/insights/insight.types";
import { getUserPreferences } from "@/features/settings/user-preferences";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARACTERS = 2_000;
const MAX_TOTAL_CHARACTERS = 12_000;
const MAX_OUTPUT_TOKENS = 900;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),

  content: z.string().trim().min(1).max(MAX_MESSAGE_CHARACTERS),
});

const requestSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  })
  .superRefine((value, context) => {
    const totalCharacters = value.messages.reduce(
      (total, message) => total + message.content.length,
      0,
    );

    if (totalCharacters > MAX_TOTAL_CHARACTERS) {
      context.addIssue({
        code: "custom",
        path: ["messages"],
        message: "The conversation is too long. Start a new chat.",
      });
    }

    const lastMessage = value.messages.at(-1);

    if (lastMessage?.role !== "user") {
      context.addIssue({
        code: "custom",
        path: ["messages"],
        message: "The final message must be from the user.",
      });
    }
  });

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    console.error("[financial-coach] Unhandled error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "The financial coach encountered an unexpected error.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 500,
      },
    );
  }
}

async function handlePost(request: Request) {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims.sub;

  if (claimsError || typeof userId !== "string") {
    return NextResponse.json(
      {
        success: false,
        error: "You must be signed in.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 401,
      },
    );
  }

  /*
   * This must run after authentication
   * succeeds and before an OpenAI request
   * or AI usage event is created.
   */
  const preferences = await getUserPreferences();

  if (!preferences.aiEnabled || preferences.aiContextMode === "disabled") {
    return NextResponse.json(
      {
        success: false,

        error: "AI features are disabled in your FinSight settings.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 403,
      },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  const model = process.env.OPENAI_MODEL?.trim();

  if (!apiKey || !model) {
    return NextResponse.json(
      {
        success: false,

        error:
          "The OpenAI integration is not configured. Add OPENAI_API_KEY and OPENAI_MODEL to the server environment.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 503,
      },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "The coach request is not valid JSON.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 400,
      },
    );
  }

  const parsed = requestSchema.safeParse(requestBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,

        error:
          parsed.error.issues[0]?.message ?? "The coach request is invalid.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 400,
      },
    );
  }

  const dailyLimit = getDailyLimit();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();

  const { count, error: countError } = await supabase
    .from("ai_usage_events")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .in("status", ["started", "completed"])
    .gte("created_at", since);

  if (countError) {
    return NextResponse.json(
      {
        success: false,

        error: "FinSight could not verify the AI usage limit.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 500,
      },
    );
  }

  const requestsUsed = count ?? 0;

  if (requestsUsed >= dailyLimit) {
    return NextResponse.json(
      {
        success: false,

        error: `You have reached the FinSight limit of ${dailyLimit} AI requests in a rolling 24-hour period.`,

        remainingRequests: 0,
      } satisfies FinancialCoachApiResponse,
      {
        status: 429,
      },
    );
  }

  const messages = parsed.data.messages as FinancialCoachMessage[];

  const promptCharacters = messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );

  const { data: usageEvent, error: usageInsertError } = await supabase
    .from("ai_usage_events")
    .insert({
      user_id: userId,
      model,
      status: "started",

      prompt_characters: promptCharacters,

      response_characters: 0,
    })
    .select("id")
    .single();

  if (usageInsertError || !usageEvent) {
    return NextResponse.json(
      {
        success: false,

        error: "FinSight could not initialize the AI request.",
      } satisfies FinancialCoachApiResponse,
      {
        status: 500,
      },
    );
  }

  const usageEventId = String(usageEvent.id);

  try {
    const financialData = await getInsightsDashboardData();

    const input = buildFinancialCoachInput({
      messages,
      data: financialData,
    });

    const openai = new OpenAI({
      apiKey,
    });

    const response = await openai.responses.create({
      model,

      instructions: FINANCIAL_COACH_INSTRUCTIONS,

      input,

      max_output_tokens: MAX_OUTPUT_TOKENS,

      store: false,
    });

    const answer = response.output_text.trim();

    if (!answer) {
      throw new Error("The model returned an empty response.");
    }

    const inputTokens = response.usage?.input_tokens ?? null;

    const outputTokens = response.usage?.output_tokens ?? null;

    const totalTokens = response.usage?.total_tokens ?? null;

    await supabase
      .from("ai_usage_events")
      .update({
        status: "completed",

        response_characters: answer.length,

        input_tokens: inputTokens,

        output_tokens: outputTokens,

        total_tokens: totalTokens,

        provider_request_id: response.id,

        error_code: null,
      })
      .eq("id", usageEventId)
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      answer,

      remainingRequests: Math.max(0, dailyLimit - requestsUsed - 1),
    } satisfies FinancialCoachApiResponse);
  } catch (error) {
    console.error("[financial-coach] OpenAI request failed:", error);

    await supabase
      .from("ai_usage_events")
      .update({
        status: "failed",

        error_code: getErrorCode(error),
      })
      .eq("id", usageEventId)
      .eq("user_id", userId);

    return NextResponse.json(
      {
        success: false,

        error: getPublicErrorMessage(error),

        remainingRequests: Math.max(0, dailyLimit - requestsUsed),
      } satisfies FinancialCoachApiResponse,
      {
        status: 502,
      },
    );
  }
}

function getDailyLimit(): number {
  const configuredLimit = Number(process.env.FINSIGHT_AI_DAILY_LIMIT ?? 20);

  if (!Number.isFinite(configuredLimit)) {
    return 20;
  }

  return Math.max(1, Math.min(200, Math.floor(configuredLimit)));
}

function getErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code.slice(0, 100);
  }

  return "unknown_error";
}

function getPublicErrorMessage(error: unknown): string {
  const errorCode = getErrorCode(error);

  if (errorCode === "insufficient_quota") {
    return (
      "Your OpenAI API project has no available " +
      "credits. Add API billing or prepaid credits " +
      "in the OpenAI Platform, then try again."
    );
  }

  if (typeof error === "object" && error !== null && "status" in error) {
    const status = Number(error.status);

    if (status === 401) {
      return (
        "OpenAI rejected the configured API key. " +
        "Verify OPENAI_API_KEY and restart FinSight."
      );
    }

    if (status === 429) {
      return (
        "The OpenAI API project reached a rate " +
        "or usage limit. Check the project's " +
        "billing and usage limits."
      );
    }

    if (status === 400) {
      return (
        "OpenAI rejected the coach request. " +
        "Check OPENAI_MODEL and your project's " +
        "model access."
      );
    }
  }

  return (
    "FinSight could not generate an AI response. " +
    "Check the server terminal and OpenAI API configuration."
  );
}
