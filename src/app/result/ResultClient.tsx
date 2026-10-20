"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuditResult, PillarScore, TeardownSection } from "@/app/api/audit/route";
export type { AuditResult, PillarScore, TeardownSection };

type ResultClientProps = {
  url: string;
  screenshotSrc: string | null;
  screenshotLoading: boolean;
  screenshotError: boolean;
  result: AuditResult | null;
  analyzeError: boolean;
  onScreenshotLoaded?: () => void;
  onScreenshotFailed?: () => void;
};

function scoreColor(n: number) {
  if (n >= 75) return "#639922";
  if (n >= 55) return "#EF9F27";
  return "#E24B4A";
}

export default function ResultClient({
  url,
  screenshotSrc,
  screenshotLoading,
  screenshotError,
  result,
  analyzeError,
  onScreenshotLoaded,
  onScreenshotFailed,
}: ResultClientProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFixIdx, setCopiedFixIdx] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [fullScreenshot, setFullScreenshot] = useState(false);

  function toggleSection(idx: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function copyText(text: string, idx?: number) {
    navigator.clipboard.writeText(text);
    if (idx !== undefined) {
      setCopiedFixIdx(idx);
      setTimeout(() => setCopiedFixIdx(null), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  async function handleDownload() {
    if (!result || !screenshotSrc) return;
    setDownloading(true);
    try {
      const { exportToPdf } = await import("@/lib/exportPdf");
      await exportToPdf(screenshotSrc, result, url);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Diagnostic export failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Metric circumference for 84px circle (r=36)
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // ~226.2
  const strokeOffset = result
    ? circumference - (circumference * Math.min(100, Math.max(0, result.score))) / 100
    : circumference;

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#1a1a1a", // Exact landing page dark shade
        fontFamily: "var(--font-body)",
        color: "#ffffff",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fade-up {
          animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .skeleton {
          animation: pulse 1.6s infinite ease-in-out;
          background: rgba(255,255,255,0.06);
          border-radius: 6px;
        }
        .sleek-card {
          background: #202020;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          transition: border-color 0.2s, background 0.2s;
        }
        .issue-card {
          transition: background 0.15s, border-color 0.15s;
        }
        .issue-card:hover {
          background: #252525 !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        .btn-action-primary:hover {
          background: #eaeaea !important;
        }
        .btn-action-secondary:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.25) !important;
        }
        .spinner-ring {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.15);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .stat-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        @media (max-width: 640px) {
          .stat-metrics-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .score-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
        }
      `}</style>

      {/* Sleek Minimal Navigation */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "#1a1a1a",
          position: "sticky",
          top: 0,
          zIndex: 30,
          gap: 12,
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: 16,
            color: "#ffffff",
            flexShrink: 0,
            padding: 0,
            letterSpacing: "-0.02em",
          }}
        >
          LandingLens
        </button>

        <div
          style={{
            fontSize: 11.5,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.55)",
            background: "rgba(255,255,255,0.05)",
            padding: "5px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "38vw",
            textAlign: "center",
          }}
        >
          {displayUrl}
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            flexShrink: 0,
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.01em",
            padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          ← New audit
        </button>
      </nav>

      {/* Sleek Central Container (Compact 680px Width) */}
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "24px 16px 80px",
        }}
      >
        {/* ── 1. VERDICT & SCORE CARD ── */}
        <div
          className="sleek-card"
          style={{
            padding: "28px 24px",
            marginBottom: 12,
          }}
        >
          {result && (
            <div className="fade-up">
              {/* Top Grade Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: 999,
                  marginBottom: 20,
                  background:
                    result.score >= 75
                      ? "rgba(99,153,34,0.15)"
                      : result.score >= 55
                        ? "rgba(239,159,39,0.15)"
                        : "rgba(226,75,74,0.15)",
                  color: scoreColor(result.score),
                  border: `1px solid ${
                    result.score >= 75
                      ? "rgba(99,153,34,0.3)"
                      : result.score >= 55
                        ? "rgba(239,159,39,0.3)"
                        : "rgba(226,75,74,0.3)"
                  }`,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {result.grade}
              </div>

              {/* Score Arc + Crisp Verdict Header */}
              <div
                className="score-header-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  marginBottom: 22,
                  flexWrap: "wrap",
                }}
              >
                {/* Sleek Circular SVG Score */}
                <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
                  <svg width="84" height="84" viewBox="0 0 84 84">
                    {/* Track */}
                    <circle
                      cx="42"
                      cy="42"
                      r={radius}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="5.5"
                    />
                    {/* Progress */}
                    <circle
                      cx="42"
                      cy="42"
                      r={radius}
                      fill="none"
                      stroke={scoreColor(result.score)}
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      transform="rotate(-90 42 42)"
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 900,
                        fontSize: 24,
                        lineHeight: 1,
                        color: scoreColor(result.score),
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {result.score}
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: "rgba(255,255,255,0.35)",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}
                    >
                      /100
                    </span>
                  </div>
                </div>

                {/* Verdict text */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    Primary Conversion Leak
                  </div>
                  <h1
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: "clamp(16px, 3.5vw, 19px)",
                      margin: "0 0 6px",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                      color: "#ffffff",
                    }}
                  >
                    {result.verdict.split(".")[0]}.
                  </h1>
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {result.verdict.split(".").slice(1).join(".").trim()}
                  </p>
                </div>
              </div>

              {/* 3 Key Diagnostic Metrics */}
              <div className="stat-metrics-grid">
                {[
                  {
                    label: "Passed Sections",
                    value: `${result.teardown.filter((s) => s.status === "pass").length} / ${result.teardown.length}`,
                    sub: "Compliant signals",
                    color: "#639922",
                  },
                  {
                    label: "Main Bottleneck",
                    value: result.stats.main_bottleneck,
                    sub: result.stats.bottleneck_impact,
                    color: "#E24B4A",
                  },
                  {
                    label: "Quick Win",
                    value: result.stats.quick_win,
                    sub: result.stats.quick_win_detail,
                    color: "#EF9F27",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "rgba(255,255,255,0.35)",
                        marginBottom: 4,
                        fontWeight: 700,
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: s.color,
                        fontFamily: "var(--font-heading)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 4,
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skeleton Loader */}
          {!result && !analyzeError && (
            <div className="fade-up" style={{ pointerEvents: "none" }}>
              <div className="skeleton" style={{ width: 100, height: 24, borderRadius: 999, marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 20, marginBottom: 20, alignItems: "center" }}>
                <div className="skeleton" style={{ width: 84, height: 84, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: "70%", height: 20, marginBottom: 10 }} />
                  <div className="skeleton" style={{ width: "90%", height: 14, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: "60%", height: 14 }} />
                </div>
              </div>
              <div className="stat-metrics-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 60 }} />
                ))}
              </div>
            </div>
          )}

          {analyzeError && (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
                Diagnostic Interrupted
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
                We could not analyze this URL. Please verify the address and retry.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#ffffff",
                  color: "#1a1a1a",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ── 2. SLEEK MAC-STYLE SCREENSHOT FRAME ── */}
        <div
          className="sleek-card"
          style={{
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          {/* Mac toolbar */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#181818",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <div
                  key={c}
                  style={{
                    width: 7.5,
                    height: 7.5,
                    borderRadius: "50%",
                    background: c,
                    opacity: 0.85,
                  }}
                />
              ))}
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  marginLeft: 8,
                  fontFamily: "monospace",
                }}
              >
                {displayUrl}
              </span>
            </div>

            {screenshotSrc && (
              <button
                onClick={() => setFullScreenshot(!fullScreenshot)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                {fullScreenshot ? "Collapse view" : "Expand full page"}
              </button>
            )}
          </div>

          {/* Screenshot Content Area */}
          <div
            style={{
              position: "relative",
              minHeight: screenshotLoading ? 180 : "auto",
              background: "#141414",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {screenshotLoading && !screenshotError && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  padding: "40px 20px",
                }}
              >
                <div className="spinner-ring" />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                  Capturing page snapshot...
                </span>
              </div>
            )}

            {screenshotError && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 700, margin: "0 0 4px" }}>
                  Unable to capture preview
                </p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                  Target page blocked automated viewport capture.
                </p>
              </div>
            )}

            {screenshotSrc && !screenshotError && (
              <div
                style={{
                  width: "100%",
                  maxHeight: fullScreenshot ? "none" : 320,
                  overflow: "hidden",
                  position: "relative",
                  transition: "max-height 0.3s ease",
                  cursor: fullScreenshot ? "default" : "pointer",
                }}
                onClick={() => !fullScreenshot && setFullScreenshot(true)}
              >
                <img
                  src={screenshotSrc}
                  alt={`Screenshot of ${url}`}
                  onLoad={onScreenshotLoaded}
                  onError={onScreenshotFailed}
                  style={{
                    width: "100%",
                    display: "block",
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
                {!fullScreenshot && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 70,
                      background: "linear-gradient(to top, #141414, transparent)",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      paddingBottom: 10,
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.6)",
                        background: "rgba(0,0,0,0.6)",
                        padding: "3px 10px",
                        borderRadius: 999,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      Click to expand full page
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 3. SLEEK TEARDOWN ACCORDION ── */}
        {result && (
          <div className="fade-up" style={{ marginBottom: 16 }}>
            {/* Header label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 4px 10px",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.35)",
                  fontWeight: 800,
                  fontFamily: "var(--font-heading)",
                }}
              >
                Conversion Teardown
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {result.teardown.length} sections analyzed
              </span>
            </div>

            {/* Collapsible Section Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {result.teardown.map((item, idx) => {
                const isPass = item.status === "pass";
                const isExpanded = expandedSections.has(idx);

                return (
                  <div
                    key={idx}
                    className="issue-card"
                    onClick={() => toggleSection(idx)}
                    style={{
                      background: "#202020",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderLeft: `3px solid ${isPass ? "#639922" : "#E24B4A"}`,
                      padding: "14px 16px",
                      cursor: "pointer",
                    }}
                  >
                    {/* Collapsed Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontWeight: 800,
                            fontSize: 14,
                            color: "#ffffff",
                            letterSpacing: "-0.01em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.section_name}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: isPass ? "rgba(99,153,34,0.15)" : "rgba(226,75,74,0.15)",
                            color: isPass ? "#639922" : "#E24B4A",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            fontFamily: "var(--font-heading)",
                          }}
                        >
                          {isPass ? "Passed" : "Issue"}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.3)",
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                            display: "inline-block",
                          }}
                        >
                          ▾
                        </span>
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          animation: "fadeUp 0.2s ease forwards",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.6)",
                            lineHeight: 1.6,
                            margin: "0 0 12px",
                          }}
                        >
                          {item.analysis}
                        </p>

                        {/* Exact copy fix with 1-click copy */}
                        <div
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 8,
                            padding: "10px 12px",
                            border: "1px solid rgba(255,255,255,0.06)",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 9.5,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: "rgba(255,255,255,0.4)",
                                fontWeight: 700,
                                marginBottom: 3,
                                fontFamily: "var(--font-heading)",
                              }}
                            >
                              Recommended Fix
                            </div>
                            <div
                              style={{
                                fontSize: 12.5,
                                color: "#ffffff",
                                lineHeight: 1.5,
                                fontWeight: 500,
                              }}
                            >
                              {item.fix}
                            </div>
                          </div>

                          <button
                            onClick={() => copyText(item.fix, idx)}
                            style={{
                              background: copiedFixIdx === idx ? "rgba(99,153,34,0.2)" : "rgba(255,255,255,0.06)",
                              color: copiedFixIdx === idx ? "#639922" : "rgba(255,255,255,0.7)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 6,
                              padding: "5px 10px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              fontFamily: "var(--font-heading)",
                              flexShrink: 0,
                            }}
                          >
                            {copiedFixIdx === idx ? "Copied" : "Copy Fix"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 4. SLEEK ACTION FOOTER ── */}
        <div
          className="sleek-card"
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: result ? "#639922" : "#EF9F27",
                animation: result ? "none" : "pulse 1.4s infinite ease-in-out",
              }}
            />
            <span style={{ fontSize: 12, color: result ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)", fontWeight: 600 }}>
              {result ? "Diagnostic Complete" : "Analyzing Conversion Signals..."}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn-action-primary"
              onClick={handleDownload}
              disabled={!result || downloading}
              style={{
                background: result ? "#ffffff" : "rgba(255,255,255,0.12)",
                color: result ? "#1a1a1a" : "rgba(255,255,255,0.35)",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 800,
                fontFamily: "var(--font-heading)",
                cursor: !result ? "not-allowed" : downloading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.15s, opacity 0.15s",
                opacity: result ? 1 : 0.6,
              }}
            >
              {downloading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(0,0,0,0.2)",
                      borderTopColor: "#1a1a1a",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Exporting...
                </>
              ) : (
                "Download PDF Report"
              )}
            </button>

            <button
              className="btn-action-secondary"
              onClick={() => result && copyText(window.location.href)}
              disabled={!result}
              style={{
                background: copiedLink ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                color: result ? "#ffffff" : "rgba(255,255,255,0.35)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                cursor: !result ? "not-allowed" : "pointer",
                transition: "background 0.15s, border-color 0.15s",
                opacity: result ? 1 : 0.6,
              }}
            >
              {copiedLink ? "Link Copied" : "Share Link"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
