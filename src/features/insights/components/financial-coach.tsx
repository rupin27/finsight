"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  LoaderCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  FinancialCoachApiResponse,
  FinancialCoachMessage,
} from "@/features/insights/insight.types";
import { cn } from "@/lib/utils";

interface FinancialCoachProps {
  enabled: boolean;
}

const suggestedQuestions = [
  "How much can I safely allocate to my goals each month?",
  "Should I prioritize my emergency fund or my student loan?",
  "What is the biggest risk in my 12-month projection?",
  "Explain my financial health score and the fastest way to improve it.",
];

export function FinancialCoach({ enabled }: FinancialCoachProps) {
  const coachId = useId();

  const textareaId = `${coachId}-question`;

  const helperId = `${coachId}-helper`;

  const requestStatusId = `${coachId}-request-status`;

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const errorRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<FinancialCoachMessage[]>([]);

  const [input, setInput] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [remainingRequests, setRemainingRequests] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(false);

  const requestLimitReached = remainingRequests === 0;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({
      block: "end",
    });
  }, [loading, messages]);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  async function submitQuestion(question: string) {
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion || loading || !enabled || requestLimitReached) {
      return;
    }

    const userMessage: FinancialCoachMessage = {
      role: "user",
      content: normalizedQuestion,
    };

    const conversation: FinancialCoachMessage[] = [
      ...messages,
      userMessage,
    ].slice(-12);

    setMessages(conversation);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/insights/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          messages: conversation,
        }),
      });

      const responseText = await response.text();

      let result: FinancialCoachApiResponse;

      try {
        result = JSON.parse(responseText) as FinancialCoachApiResponse;
      } catch {
        throw new Error(
          `The financial coach returned an unreadable response with HTTP ${response.status}.`,
        );
      }

      if (typeof result.remainingRequests === "number") {
        setRemainingRequests(result.remainingRequests);
      }

      if (!response.ok || !result.success || !result.answer) {
        setError(result.error ?? "The financial coach could not answer.");

        return;
      }

      const assistantMessage: FinancialCoachMessage = {
        role: "assistant",
        content: result.answer,
      };

      setMessages([...conversation, assistantMessage].slice(-12));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "FinSight could not reach the financial coach.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void submitQuestion(input);
  }

  function clearConversation() {
    setMessages([]);
    setInput("");
    setError(null);
  }

  return (
    <section
      aria-labelledby={`${coachId}-title`}
      className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-[0_18px_55px_rgba(0,0,0,0.12)]"
    >
      <header className="border-b border-white/[0.07] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="size-4 text-violet-300" />

              <h2 id={`${coachId}-title`} className="section-title">
                Ask FinSight
              </h2>
            </div>

            <p className="section-description max-w-xl">
              Ask questions using your calculated balances, goals, projections,
              and payoff estimates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-h-9 items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 text-xs font-medium text-emerald-200/75">
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              Read-only context
            </div>

            {enabled && messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={clearConversation}
                className="border-white/10 bg-transparent text-white/48 hover:bg-white/[0.06] hover:text-white"
              >
                <RotateCcw className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      {!enabled ? (
        <DisabledCoachState />
      ) : (
        <>
          <div
            role="log"
            aria-label="Conversation with the FinSight AI coach"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={loading}
            className="min-h-[380px] max-h-[600px] overflow-y-auto p-5 sm:p-6"
          >
            {messages.length === 0 ? (
              <EmptyConversation
                disabled={loading || requestLimitReached}
                onQuestion={submitQuestion}
              />
            ) : (
              <div className="space-y-5">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.role}-${index}`}
                    message={message}
                  />
                ))}

                {loading && (
                  <div
                    role="status"
                    aria-label="FinSight is preparing an answer"
                    className="flex items-start gap-3"
                  >
                    <div
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/10 text-violet-300"
                    >
                      <Bot className="size-4" />
                    </div>

                    <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.035] px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-white/45">
                        <LoaderCircle
                          aria-hidden="true"
                          className="size-4 animate-spin text-violet-300"
                        />
                        Thinking…
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={transcriptEndRef} aria-hidden="true" />
          </div>

          <footer className="border-t border-white/[0.07] bg-white/[0.012] p-4 sm:p-5">
            {error && (
              <div
                ref={errorRef}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200 outline-none"
              >
                {error}
              </div>
            )}

            {requestLimitReached && (
              <div
                role="status"
                className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm leading-6 text-amber-200"
              >
                You have no AI coach requests remaining. The deterministic
                insights above remain available.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              aria-busy={loading}
              className="flex items-end gap-3"
            >
              <div className="min-w-0 flex-1">
                <label htmlFor={textareaId} className="sr-only">
                  Ask the FinSight financial coach a question
                </label>

                <Textarea
                  id={textareaId}
                  value={input}
                  disabled={loading || requestLimitReached}
                  maxLength={2_000}
                  rows={2}
                  placeholder="Ask about spending, savings, goals, projections, or loan payoff..."
                  aria-describedby={`${helperId} ${requestStatusId}`}
                  onChange={(event) => {
                    setInput(event.target.value);

                    if (error) {
                      setError(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();

                      void submitQuestion(input);
                    }
                  }}
                  className="min-h-12 resize-none bg-white/[0.035]"
                />
              </div>

              <Button
                type="submit"
                size="icon"
                disabled={
                  loading || requestLimitReached || input.trim().length === 0
                }
                aria-label={loading ? "Sending question" : "Send question"}
                className="size-12 shrink-0 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>

            <div className="mt-3 flex flex-col gap-1 text-xs text-white/28 sm:flex-row sm:items-center sm:justify-between">
              <span id={helperId}>
                Enter to send · Shift+Enter for a new line
              </span>

              <span id={requestStatusId} aria-live="polite">
                {remainingRequests !== null
                  ? `${remainingRequests} AI ${
                      remainingRequests === 1 ? "request" : "requests"
                    } remaining`
                  : `${input.length.toLocaleString()}/2,000 characters`}
              </span>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}

function EmptyConversation({
  disabled,
  onQuestion,
}: {
  disabled: boolean;

  onQuestion: (question: string) => Promise<void>;
}) {
  return (
    <div>
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-violet-400/10 bg-violet-400/10 text-violet-300">
          <Bot aria-hidden="true" className="size-6" />
        </div>

        <h3 className="mt-5 text-base font-semibold tracking-[-0.015em] text-white">
          What would you like to understand?
        </h3>

        <p className="mt-2 text-sm leading-6 text-white/38">
          FinSight sends aggregate financial metrics rather than merchant names,
          transaction notes, passwords, or bank credentials.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {suggestedQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => {
              void onQuestion(question);
            }}
            className="min-h-24 rounded-xl border border-white/[0.07] bg-black/10 p-4 text-left text-sm leading-6 text-white/52 outline-none transition-[border-color,background-color,color,transform] hover:-translate-y-px hover:border-cyan-400/20 hover:bg-cyan-400/[0.035] hover:text-white/75 focus-visible:border-cyan-300/45 focus-visible:ring-2 focus-visible:ring-cyan-300/20 disabled:pointer-events-none disabled:opacity-45"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

function DisabledCoachState() {
  return (
    <div className="px-6 py-14 text-center sm:py-16">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-violet-400/10 bg-violet-400/10 text-violet-300">
        <Bot aria-hidden="true" className="size-6" />
      </div>

      <h3 className="mt-5 text-base font-semibold tracking-[-0.015em] text-white">
        AI coach is unavailable
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/38">
        The AI coach may be disabled in your privacy settings or unavailable in
        the current server environment. Your deterministic health score and
        recommendations remain active.
      </p>

      <Link
        href="/settings"
        className={cn(
          buttonVariants({
            variant: "outline",
            size: "sm",
          }),

          "mt-6 border-white/10 bg-transparent text-white/60 hover:bg-white/[0.06]",
        )}
      >
        Review AI settings
      </Link>
    </div>
  );
}

function ChatMessage({ message }: { message: FinancialCoachMessage }) {
  const isUser = message.role === "user";

  const Icon = isUser ? UserRound : Bot;

  return (
    <article
      aria-label={isUser ? "Your message" : "FinSight AI coach response"}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl border",

          isUser
            ? "border-cyan-400/10 bg-cyan-400/10 text-cyan-300"
            : "border-violet-400/10 bg-violet-400/10 text-violet-300",
        )}
      >
        <Icon className="size-4" />
      </div>

      <div
        className={cn(
          "max-w-[88%] whitespace-pre-wrap break-words rounded-2xl border px-4 py-3 text-sm leading-6",

          isUser
            ? "rounded-tr-md border-cyan-400/15 bg-cyan-400/[0.05] text-white/72"
            : "rounded-tl-md border-white/[0.06] bg-white/[0.035] text-white/62",
        )}
      >
        {message.content}
      </div>
    </article>
  );
}
