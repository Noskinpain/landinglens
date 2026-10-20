"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ResultClient, { type AuditResult } from "./ResultClient";

function normalizeUrl(input: string) {
  const value = input.trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") || "";
  const force = searchParams.get("force") === "true";
  const url = normalizeUrl(rawUrl);

  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(true);
  const [screenshotError, setScreenshotError] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState(false);

  useEffect(() => {
    if (!url) {
      setScreenshotSrc(null);
      setScreenshotLoading(false);
      setScreenshotError(true);
      setResult(null);
      setAnalyzeError(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setScreenshotSrc(null);
    setScreenshotLoading(true);
    setScreenshotError(false);
    setResult(null);
    setAnalyzeError(false);

    setScreenshotSrc(`/api/screenshot?url=${encodeURIComponent(url)}&force=${force}`);

    async function loadAudit() {
      try {
        const res = await fetch(`/api/audit?url=${encodeURIComponent(url)}&force=${force}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setAnalyzeError(true);
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setResult(data.result ?? null);
          if (!data.result) {
            setAnalyzeError(true);
          }
        }
      } catch (error) {
        if (controller.signal.aborted || cancelled) {
          return;
        }

        setAnalyzeError(true);
      }
    }

    void loadAudit();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, force]);

  useEffect(() => {
    if (!screenshotSrc || !screenshotLoading || screenshotError) return;

    const timeoutId = window.setTimeout(() => {
      setScreenshotLoading(false);
      setScreenshotError(true);
    }, 40000);

    return () => window.clearTimeout(timeoutId);
  }, [screenshotSrc, screenshotLoading, screenshotError]);

  return (
    <ResultClient
      url={url}
      screenshotSrc={screenshotSrc}
      screenshotLoading={screenshotLoading}
      screenshotError={screenshotError}
      result={result}
      analyzeError={analyzeError}
      onScreenshotLoaded={() => setScreenshotLoading(false)}
      onScreenshotFailed={() => {
        setScreenshotLoading(false);
        setScreenshotError(true);
      }}
    />
  );
}

export default function ResultPageClient() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", background: "#1a1a1a", color: "rgba(255,255,255,0.7)", display: "grid", placeItems: "center", fontFamily: "var(--font-body)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 26,
                height: 26,
                border: "2px solid rgba(255,255,255,0.15)",
                borderTopColor: "#ffffff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>
              Initializing diagnostic audit...
            </span>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
