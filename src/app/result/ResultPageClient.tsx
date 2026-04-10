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
        <div style={{ minHeight: "100dvh", background: "#0a0a0a", color: "#fff", display: "grid", placeItems: "center" }}>
          Loading audit results...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
