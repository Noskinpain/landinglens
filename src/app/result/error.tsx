"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResultError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to the console
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#1a1a1a",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-heading)", marginBottom: 12 }}>
        Diagnostic Failed
      </h2>
      <p style={{ color: "#f87171", marginBottom: 24, maxWidth: 500, textAlign: "center", wordBreak: "break-word", fontSize: 13.5 }}>
        {error.message || "Unable to complete landing page teardown."}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => reset()}
          style={{
            background: "#ffffff",
            color: "#1a1a1a",
            padding: "10px 18px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Retry Diagnostic
        </button>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "transparent",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.2)",
            padding: "10px 18px",
            borderRadius: "var(--radius-sm)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
