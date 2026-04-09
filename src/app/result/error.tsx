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
        background: "#0a0a0a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
        Something went wrong on the result page!
      </h2>
      <p style={{ color: "#ff6b6b", marginBottom: 24, maxWidth: 500, textAlign: "center", wordBreak: "break-word" }}>
        {error.message || "Unknown error"}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => reset()}
          style={{
            background: "#fff",
            color: "#0a0a0a",
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid #333",
            padding: "10px 16px",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
