"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "grid",
          placeItems: "center",
          padding: "24px",
          color: "#ffffff",
          background: "#07090e",

          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", Arial, sans-serif',
        }}
      >
        <main
          role="alert"
          style={{
            width: "100%",
            maxWidth: "560px",
            padding: "32px",
            textAlign: "center",
            border: "1px solid rgba(248, 113, 113, 0.22)",
            borderRadius: "20px",
            background: "rgba(248, 113, 113, 0.05)",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              display: "grid",
              placeItems: "center",
              width: "56px",
              height: "56px",
              margin: "0 auto",
              borderRadius: "16px",
              color: "#fca5a5",
              background: "rgba(248, 113, 113, 0.12)",
              fontSize: "24px",
            }}
          >
            !
          </div>

          <h1
            style={{
              margin: "20px 0 0",
              fontSize: "24px",
              lineHeight: 1.2,
              letterSpacing: "-0.025em",
            }}
          >
            FinSight encountered a problem
          </h1>

          <p
            style={{
              margin: "12px auto 0",
              maxWidth: "440px",
              color: "rgba(255,255,255,0.55)",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            The application could not finish loading. Your financial data was
            not modified.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: "12px",
                color: "rgba(255,255,255,0.28)",
                fontFamily:
                  '"SFMono-Regular", Menlo, Monaco, Consolas, monospace',
                fontSize: "12px",
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "42px",
              marginTop: "24px",
              padding: "0 18px",
              border: 0,
              borderRadius: "12px",
              color: "#08111c",
              background: "#67e8f9",
              font: "inherit",
              fontSize: "14px",
              fontWeight: 650,
              cursor: "pointer",
            }}
          >
            Reload FinSight
          </button>
        </main>
      </body>
    </html>
  );
}
