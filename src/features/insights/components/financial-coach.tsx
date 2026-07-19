"use client";

import { FormEvent, useRef, useState } from "react";
import {
  Bot,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import type {
  FinancialCoachApiResponse,
  FinancialCoachMessage,
} from "@/features/insights/insight.types";
import { Button } from "@/components/ui/button";
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
  const [messages, setMessages] = useState<FinancialCoachMessage[]>([]);

  const [input, setInput] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [remainingRequests, setRemainingRequests] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function submitQuestion(question: string) {
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion || loading || !enabled) {
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

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        throw new Error(`The coach service returned HTTP ${response.status}.`);
      }

      const result = (await response.json()) as FinancialCoachApiResponse;

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

      const updatedConversation: FinancialCoachMessage[] = [
        ...conversation,
        assistantMessage,
      ].slice(-12);

      setMessages(updatedConversation);
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

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      <header className="border-b border-white/[0.07] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-300" />

              <h2 className="font-medium text-white">Ask FinSight</h2>
            </div>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/35">
              Ask questions using your calculated balances, goals, projections,
              and payoff estimates.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5 text-xs text-emerald-200/70">
            <ShieldCheck className="size-3.5" />
            Read-only context
          </div>
        </div>
      </header>

      {!enabled ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
            <Bot className="size-6" />
          </div>

          <h3 className="mt-5 font-medium text-white">
            OpenAI is not configured
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/35">
            Add OPENAI_API_KEY and OPENAI_MODEL to the server environment, then
            restart FinSight.
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-[380px] max-h-[600px] overflow-y-auto p-5 sm:p-6">
            {messages.length === 0 ? (
              <div>
                <div className="mx-auto max-w-lg text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
                    <Bot className="size-6" />
                  </div>

                  <h3 className="mt-5 font-medium text-white">
                    What would you like to understand?
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/35">
                    FinSight sends aggregate financial metrics—not merchant
                    names, transaction notes, passwords, or bank credentials.
                  </p>
                </div>

                <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => {
                        void submitQuestion(question);
                      }}
                      className="rounded-xl border border-white/[0.07] bg-black/10 p-4 text-left text-sm leading-6 text-white/50 transition-colors hover:border-cyan-400/20 hover:bg-cyan-400/[0.035] hover:text-white/70"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.role}-${index}`}
                    message={message}
                  />
                ))}

                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                      <Bot className="size-4" />
                    </div>

                    <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.035] px-4 py-3">
                      <LoaderCircle className="size-4 animate-spin text-violet-300" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="border-t border-white/[0.07] p-4 sm:p-5">
            {error && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                disabled={loading}
                maxLength={2_000}
                rows={2}
                placeholder="Ask about spending, savings, goals, projections, or loan payoff..."
                onChange={(event) => {
                  setInput(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();

                    void submitQuestion(input);
                  }
                }}
                className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/35"
              />

              <Button
                type="submit"
                size="icon"
                disabled={loading || input.trim().length === 0}
                className="size-12 shrink-0 bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>

            <div className="mt-3 flex flex-col gap-1 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">
              <span>Enter to send · Shift+Enter for a new line</span>

              <span>
                {remainingRequests !== null
                  ? `${remainingRequests} AI requests remaining`
                  : "AI answers are estimates and may contain errors"}
              </span>
            </div>
          </footer>
        </>
      )}
    </section>
  );
}

function ChatMessage({ message }: { message: FinancialCoachMessage }) {
  const isUser = message.role === "user";

  const Icon = isUser ? UserRound : Bot;

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          isUser
            ? "bg-cyan-400/10 text-cyan-300"
            : "bg-violet-400/10 text-violet-300",
        )}
      >
        <Icon className="size-4" />
      </div>

      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm leading-6",
          isUser
            ? "rounded-tr-md border-cyan-400/15 bg-cyan-400/[0.05] text-white/70"
            : "rounded-tl-md border-white/[0.06] bg-white/[0.035] text-white/60",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
