"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Issue = {
  id: number;
  label: string;
  severity: "critical" | "warning" | "good";
  score: number;
  roast: string;
  fix: string;
};

export type TeardownSection = {
  section_name: string;
  status: "pass" | "fail";
  analysis: string;
  fix: string;
};

export type AuditResult = {
  score: number;
  grade: string;
  verdict: string;
  stats: {
    issues_found: number;
    critical_count: number;
    main_bottleneck: string;
    bottleneck_impact: string;
    quick_win: string;
    quick_win_detail: string;
  };
  teardown: TeardownSection[];
  comprehensive_playbook: string;
};

function severityColor(s: string) {
  if (s === "critical") return "var(--critical)";
  if (s === "warning") return "var(--warning)";
  return "var(--success)";
}

function severityBadge(s: string) {
  if (s === "critical")
    return { bg: "rgba(163,45,45,0.1)", color: "#ff6b6b", label: "Critical" };
  if (s === "warning")
    return { bg: "rgba(133,79,11,0.1)", color: "#f0a500", label: "Warning" };
  return { bg: "rgba(59,109,17,0.1)", color: "#5cb85c", label: "Strong" };
}

function gradeEmoji(g: string) {
  if (g === "Conversion killer") return "💀";
  if (g === "Needs work") return "😬";
  if (g === "Getting there") return "🔧";
  if (g === "Strong page") return "💪";
  if (g === "High converter") return "🏆";
  return "🔥";
}

function scoreColor(n: number) {
  if (n >= 75) return "#5cb85c";
  if (n >= 50) return "#f0a500";
  return "#ff6b6b";
}

function barColor(n: number) {
  if (n >= 7) return "#5cb85c";
  if (n >= 5) return "#f0a500";
  return "#ff6b6b";
}

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
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  function toggleSection(idx: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function handleDownload() {
    if (!result || !screenshotSrc) return;
    setDownloading(true);
    try {
      const { exportToPdf } = await import("@/lib/exportPdf");
      await exportToPdf(screenshotSrc, result, url);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const displayUrl = url.replace(/^https?:\/\//, "");

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#0a0a0a",
        fontFamily: "var(--font-body)",
        color: "#f0f0f0",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scoreReveal {
          from { stroke-dashoffset: 565; }
          to { stroke-dashoffset: var(--target-offset); }
        }
        .skeleton {
          animation: pulse 1.5s infinite ease-in-out;
          background: rgba(255,255,255,0.06);
          border-radius: 4px;
        }
        .fade-up {
          animation: fadeUp 0.4s ease forwards;
        }
        .issue-card {
          transition: border-color 0.2s, background 0.2s;
        }
        .issue-card:hover {
          border-color: rgba(255,255,255,0.15) !important;
          background: #1a1a1a !important;
        }
        .dl-btn:hover {
          background: #222 !important;
        }
        .copy-btn:hover {
          background: #1a1a1a !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
        .spinner-ring {
          width: 28px;
          height: 28px;
          border: 2.5px solid rgba(255,255,255,0.1);
          border-top-color: rgba(255,255,255,0.6);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .back-btn {
          transition: color 0.2s;
        }
        .back-btn:hover {
          color: #fff !important;
        }
        @media (max-width: 480px) {
          .stat-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }
          .cta-row {
            flex-direction: column !important;
          }
          .cta-row button {
            width: 100%;
          }
        }
      `}</style>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(10,10,10,1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          gap: 12,
        }}
      >
        {/* Logo */}
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
            color: "#fff",
            flexShrink: 0,
            padding: 0,
            letterSpacing: "-0.02em",
          }}
        >
          LandingLens
        </button>

        {/* URL pill */}
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.05)",
            padding: "5px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "36vw",
            flex: 1,
            textAlign: "center",
            letterSpacing: "0.01em",
          }}
        >
          {displayUrl}
        </div>

        {/* Back */}
        <button
          className="back-btn"
          onClick={() => router.push("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            flexShrink: 0,
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.01em",
            padding: 0,
          }}
        >
          ← New audit
        </button>
      </nav>

      <div
        style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 64px" }}
      >
        {/* ── VERDICT CARD ── */}
        <div
          style={{
            background: "#111",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "28px 22px",
            marginBottom: 10,
          }}
        >
          {result && (
            <div className="fade-up">
              {/* Grade badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "5px 14px",
                  borderRadius: 999,
                  marginBottom: 20,
                  background:
                    result.score >= 75
                      ? "rgba(92,184,92,0.12)"
                      : result.score >= 50
                        ? "rgba(240,165,0,0.12)"
                        : "rgba(255,107,107,0.12)",
                  color:
                    result.score >= 75
                      ? "#5cb85c"
                      : result.score >= 50
                        ? "#f0a500"
                        : "#ff6b6b",
                  border: `1px solid ${result.score >= 75 ? "rgba(92,184,92,0.2)" : result.score >= 50 ? "rgba(240,165,0,0.2)" : "rgba(255,107,107,0.2)"}`,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {gradeEmoji(result.grade)} {result.grade}
              </div>

              {/* Score + Verdict row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                  marginBottom: 22,
                  flexWrap: "wrap",
                }}
              >
                {/* Circular score */}
                <div style={{ flexShrink: 0, position: "relative" }}>
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    {/* Track */}
                    <circle
                      cx="45"
                      cy="45"
                      r="38"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="6"
                    />
                    {/* Progress */}
                    <circle
                      cx="45"
                      cy="45"
                      r="38"
                      fill="none"
                      stroke={scoreColor(result.score)}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="239"
                      strokeDashoffset={239 - (239 * result.score) / 100}
                      transform="rotate(-90 45 45)"
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
                        fontSize: 26,
                        lineHeight: 1,
                        color: scoreColor(result.score),
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {result.score}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.3)",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                      }}
                    >
                      /100
                    </span>
                  </div>
                </div>

                {/* Verdict text */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: "clamp(15px, 4vw, 19px)",
                      marginBottom: 8,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                      color: "#fff",
                    }}
                  >
                    "{result.verdict.split(".")[0]}."
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.7,
                    }}
                  >
                    {result.verdict.split(".").slice(1).join(".").trim()}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div
                className="stat-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  paddingTop: 18,
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {[
                  {
                    label: "Passed",
                    value: String(result.teardown.filter((s) => s.status === "pass").length),
                    sub: `out of ${result.teardown.length} sections`,
                    color: "#5cb85c",
                  },
                  {
                    label: "Main Bottleneck",
                    value: result.stats.main_bottleneck,
                    sub: result.stats.bottleneck_impact,
                    color: "#ff6b6b",
                  },
                  {
                    label: "Quick Win",
                    value: result.stats.quick_win,
                    sub: result.stats.quick_win_detail,
                    color: "#f0a500",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 10,
                      padding: "12px 10px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.3)",
                        marginBottom: 5,
                        fontWeight: 700,
                      }}
                    >
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 800,
                        fontSize: "clamp(15px, 4vw, 20px)",
                        color: s.color,
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                        marginBottom: 4,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!result && !analyzeError && (
            <div className="fade-up" style={{ pointerEvents: "none" }}>
              <div className="skeleton" style={{ width: 80, height: 26, borderRadius: 999, marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 20, marginBottom: 22 }}>
                <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "8px 0" }}>
                  <div className="skeleton" style={{ width: "70%", height: 22, borderRadius: 6, marginBottom: 16 }} />
                  <div className="skeleton" style={{ width: "90%", height: 14, borderRadius: 4, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: "60%", height: 14, borderRadius: 4 }} />
                </div>
              </div>
              <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SCREENSHOT ── */}
        <div
          style={{
            background: "#111",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          {/* Mac-style bar */}
          <div
            style={{
              padding: "9px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
              <div
                key={c}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c,
                  opacity: 0.8,
                }}
              />
            ))}
            <span
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.25)",
                marginLeft: 8,
                fontWeight: 500,
              }}
            >
              {displayUrl}
            </span>
          </div>

          {screenshotLoading && !screenshotError && (
            <div
              style={{
                height: 160,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <div className="spinner-ring" />
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 600,
                }}
              >
                Capturing screenshot...
              </p>
            </div>
          )}

          {screenshotError && (
            <div
              style={{
                height: 160,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 20,
              }}
            >
              <span style={{ fontSize: 28 }}>🔍</span>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  textAlign: "center",
                }}
              >
                Couldn't reach that URL
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  textAlign: "center",
                }}
              >
                Check the address and try again
              </p>
              <button
                onClick={() => router.push("/")}
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  fontFamily: "var(--font-heading)",
                }}
              >
                ← Try a different URL
              </button>
            </div>
          )}

          {screenshotSrc && !screenshotError && (
            <img
              src={screenshotSrc}
              alt="Page screenshot"
              onLoad={onScreenshotLoaded}
              onError={onScreenshotFailed}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          )}
        </div>

        {/* ── ISSUES ── */}
        {!result && !analyzeError && (
          <div className="fade-up" style={{ pointerEvents: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, paddingTop: 8 }}>
              <div className="skeleton" style={{ width: 140, height: 12 }} />
              <div className="skeleton" style={{ width: 50, height: 12 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: "#111", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div className="skeleton" style={{ width: "60%", height: 18, borderRadius: 6 }} />
                    <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 999 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
                    <div className="skeleton" style={{ width: 28, height: 14, borderRadius: 4 }} />
                    <div className="skeleton" style={{ flex: 1, height: 3, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {result && (
          <div className="fade-up">
            {/* Section label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
                paddingTop: 8,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 700,
                  fontFamily: "var(--font-heading)",
                }}
              >
                Full Teardown
              </p>
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  fontWeight: 600,
                }}
              >
                {result.teardown.length} sections
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {result.teardown.map((section, idx) => {
                const isPass = section.status === "pass";
                const isExpanded = expandedSections.has(idx);
                return (
                  <div
                    key={idx}
                    className="issue-card"
                    onClick={() => toggleSection(idx)}
                    style={{
                      background: "#111",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderLeft: `3px solid ${isPass ? "var(--success)" : "var(--critical)"}`,
                      padding: "16px 18px",
                      cursor: "pointer",
                      animation: `fadeUp 0.3s ease ${idx * 0.05}s both`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-heading)",
                            fontWeight: 800,
                            fontSize: "clamp(13px, 3.5vw, 15px)",
                            color: "#fff",
                            letterSpacing: "-0.01em",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {section.section_name}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 999,
                            background: isPass ? "rgba(59,109,17,0.1)" : "rgba(163,45,45,0.1)",
                            color: isPass ? "#5cb85c" : "#ff6b6b",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          {isPass ? "Pass" : "Fail"}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.25)",
                            transition: "transform 0.2s",
                            transform: isExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            display: "inline-block",
                          }}
                        >
                          ▾
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: 14,
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          paddingTop: 14,
                          animation: "fadeUp 0.2s ease forwards",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            color: "rgba(255,255,255,0.6)",
                            lineHeight: 1.7,
                            marginBottom: 14,
                          }}
                        >
                          {section.analysis}
                        </p>

                        <div
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            borderRadius: 10,
                            padding: "12px 14px",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 9,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "rgba(255,255,255,0.3)",
                              marginBottom: 6,
                              fontWeight: 700,
                            }}
                          >
                            {isPass ? "Optimization Tip" : "Fix Right Now"}
                          </div>
                          <p
                            style={{
                              fontSize: 13,
                              color: "rgba(255,255,255,0.85)",
                              lineHeight: 1.6,
                              fontStyle: "italic",
                            }}
                          >
                            {section.fix}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── CTA ── */}
            <div
              style={{
                background: "#111",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "22px 20px",
                marginTop: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 18,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: "clamp(16px, 4vw, 19px)",
                      marginBottom: 4,
                      letterSpacing: "-0.02em",
                      color: "#fff",
                    }}
                  >
                    Get the full PDF report
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                      lineHeight: 1.5,
                    }}
                  >
                    Share with your team · Keep forever · Free during beta
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(92,184,92,0.12)",
                    border: "1px solid rgba(92,184,92,0.2)",
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#5cb85c",
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                  }}
                >
                  FREE
                </div>
              </div>

              <div
                className="cta-row"
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              >
                <button
                  className="dl-btn"
                  disabled
                  title="Checkout system coming soon"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.4)",
                    border: "none",
                    borderRadius: 10,
                    padding: "13px 24px",
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "-0.01em",
                    cursor: "not-allowed",
                    flex: 1,
                  }}
                >
                  Download PDF (Coming soon)
                </button>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    background: copied ? "rgba(92,184,92,0.1)" : "rgba(255,255,255,0.05)",
                    color: copied ? "#5cb85c" : "rgba(255,255,255,0.5)",
                    border: copied ? "1px solid rgba(92,184,92,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "13px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied ? "✅ Copied!" : "🔗 Copy link"}
                </button>
                <button
                  className="copy-btn"
                  onClick={() => {
                    router.push(`/result?url=${encodeURIComponent(url)}&force=true`);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    padding: "13px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    transition: "background 0.2s, border-color 0.2s",
                    whiteSpace: "nowrap",
                    flexBasis: "100%",
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 4
                  }}
                >
                  ♻️ I updated my page — Re-audit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYZE ERROR ── */}
        {analyzeError && (
          <div
            style={{
              background: "#111",
              borderRadius: 16,
              border: "1px solid rgba(255,107,107,0.2)",
              padding: 24,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 6,
              }}
            >
              Analysis failed
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              Something went wrong. Try again.
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                marginTop: 16,
                background: "#fff",
                color: "#0a0a0a",
                border: "none",
                borderRadius: 10,
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "var(--font-heading)",
              }}
            >
              ← Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
