"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    __landingLensHydrated?: boolean;
  }
}

type HomeClientProps = {
  initialUrl: string;
};

export default function HomeClient({ initialUrl }: HomeClientProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.__landingLensHydrated = true;

    function resetLoadingState() {
      setIsSubmitting(false);
    }

    window.addEventListener("pageshow", resetLoadingState);
    return () => {
      delete window.__landingLensHydrated;
      window.removeEventListener("pageshow", resetLoadingState);
    };
  }, []);

  function normalizeUrl(input: string): string {
    let value = input.trim();
    if (!value) return value;
    if (!/^https?:\/\//i.test(value)) {
      value = "https://" + value;
    }
    return value;
  }

  function isValidUrl(value: string) {
    try {
      const parsed = new URL(value);
      const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
      if (!isHttp) return false;

      const hostname = parsed.hostname.trim();
      const hasDot = hostname.includes(".");
      const isLocalhost = hostname === "localhost";
      const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);

      return hasDot || isLocalhost || isIpv4;
    } catch {
      return false;
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    const normalized = normalizeUrl(url);
    if (!normalized) {
      setIsSubmitting(false);
      setError("Please enter a URL.");
      return;
    }

    if (!isValidUrl(normalized)) {
      setIsSubmitting(false);
      setError(
        "That doesn't look like a valid URL. Try something like yoursite.com",
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    window.setTimeout(() => {
      router.push(`/result?url=${encodeURIComponent(normalized)}`);
    }, 2200);
  }

  function handlePrefillClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    example: string,
  ) {
    e.preventDefault();
    if (isSubmitting) return;

    const normalized = normalizeUrl(example);
    setUrl(normalized);
    setError("");

    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, "", cleanUrl);
    window.requestAnimationFrame(() => {
      document.getElementById("url-input")?.focus();
    });
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          LandingLens
        </span>

        <button
          type="button"
          onClick={() => {
            document
              .getElementById("how-it-works")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            background: "none",
            border: "1.5px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--surface)";
            e.currentTarget.style.borderColor = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.borderColor = "var(--border-strong)";
          }}
        >
          How it works
        </button>
      </nav>

      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px 80px",
          textAlign: "center",
        }}
        className="relative z-10"
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
            }}
          >
            INSTANT - FREE TO TRY - NO SIGNUP
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: "clamp(3.4rem, 7vw, 4.8rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: 700,
            marginBottom: 20,
            color: "var(--text-primary)",
          }}
        >
          Your landing page{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span
              style={{ position: "relative", zIndex: 1, fontStyle: "italic" }}
            >
              is leaking
            </span>
            <span
              style={{
                position: "absolute",
                inset: "2px -4px",
                background: "var(--accent)",
                transform: "rotate(-1deg)",
                borderRadius: 4,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />
          </span>{" "}
          conversions.
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
            color: "var(--text-secondary)",
            maxWidth: 480,
            lineHeight: 1.65,
            marginBottom: 36,
          }}
        >
          Drop your URL. Get a scored, specific breakdown of every problem on
          your page with exact fixes.
        </p>

        <div
          style={{
            width: "100%",
            maxWidth: 520,
            position: "relative",
            zIndex: 20,
          }}
        >
          <form
            id="url-form"
            action="/result"
            method="GET"
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              gap: 8,
              flexDirection: "row",
            }}
          >
            <input
              id="url-input"
              type="text"
              name="url"
              inputMode="url"
              autoComplete="url"
              disabled={isSubmitting}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yoursite.com"
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "1.5px solid var(--border-strong)",
                borderRadius: "var(--radius-md)",
                padding: "14px 18px",
                fontSize: 16,
                color: "var(--text-primary)",
                outline: "none",
                transition: "border-color 0.2s",
                minWidth: 0,
                WebkitAppearance: "none",
                appearance: "none",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--text-primary)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--border-strong)")
              }
            />

            <button
              id="submit-button"
              type="submit"
              disabled={isSubmitting}
              style={{
                background: "var(--text-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                padding: "14px 22px",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                transition: "background 0.2s",
                flexShrink: 0,
                cursor: isSubmitting ? "progress" : "pointer",
                opacity: isSubmitting ? 0.92 : 1,
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minWidth: 128,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = "#333";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--text-primary)";
              }}
            >
              <span
                id="submit-spinner"
                className="spinner"
                aria-hidden="true"
                style={{
                  width: 16,
                  height: 16,
                  borderColor: "rgba(255,255,255,0.35)",
                  borderTopColor: "#fff",
                  display: isSubmitting ? "inline-block" : "none",
                }}
              />
              <span id="submit-label">
                {isSubmitting ? "Roasting..." : "Roast it ->"}
              </span>
            </button>
          </form>

          {error && (
            <p
              id="url-error"
              aria-live="polite"
              style={{
                fontSize: 12,
                color: "var(--critical)",
                marginTop: 8,
                textAlign: "left",
              }}
            >
              {error}
            </p>
          )}
          {!error && (
            <p
              id="url-error"
              aria-live="polite"
              style={{
                fontSize: 12,
                color: "var(--critical)",
                marginTop: 8,
                textAlign: "left",
                display: "none",
              }}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {[
                "https://randomuser.me/api/portraits/men/32.jpg",
                "https://randomuser.me/api/portraits/women/44.jpg",
                "https://randomuser.me/api/portraits/men/68.jpg",
                "https://randomuser.me/api/portraits/women/65.jpg",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "2px solid #0a0a0a",
                    marginLeft: i === 0 ? 0 : -12,
                    zIndex: 10 - i,
                    position: "relative",
                  }}
                  alt=""
                />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
              <strong style={{ color: "var(--text-secondary)" }}>
                200+ founders
              </strong>{" "}
              have already audited their page.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Try:
            </span>
            {["stripe.com", "linear.app", "vercel.com"].map((example) => (
              <a
                key={example}
                href={`/?prefill=${encodeURIComponent(normalizeUrl(example))}#url-input`}
                data-prefill-url={normalizeUrl(example)}
                onClick={(e) => handlePrefillClick(e, example)}
                style={{
                  background: "none",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  padding: "6px 4px",
                  minHeight: 44,
                  minWidth: 44,
                  display: "inline-flex",
                  alignItems: "center",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}
              >
                {example}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        style={{
          background: "var(--text-primary)",
          padding: "72px 24px",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 56,
              fontFamily: "var(--font-heading)",
            }}
          >
            How it works
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                step: "01",
                title: "Paste your URL",
                desc: "Drop in any landing page - homepage, product page, or campaign. No account needed.",
                tag: "2 seconds",
              },
              {
                step: "02",
                title: "AI roasts it",
                desc: "Our AI tears through your page - headline, CTA, layout, copy, social proof. Nothing is spared.",
                tag: "~15 seconds",
              },
              {
                step: "03",
                title: "Fix what's broken",
                desc: "Get a scored report with specific rewrites for every issue. Download it as a PDF.",
                tag: "Instant",
              },
            ].map(({ step, title, desc, tag }, i, arr) => (
              <div
                key={step}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr",
                  gap: "0 20px",
                  padding: "36px 0",
                  borderBottom:
                    i !== arr.length - 1
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "none",
                  alignItems: "start",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: 900,
                    fontSize: "clamp(3rem, 8vw, 4rem)",
                    lineHeight: 1,
                    color: "rgba(255,255,255,0.12)",
                    letterSpacing: "-0.04em",
                    userSelect: "none",
                    paddingTop: 2,
                  }}
                >
                  {step}
                </span>

                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.04em",
                      marginBottom: 12,
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {tag}
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: "clamp(1.4rem, 4vw, 1.75rem)",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.1,
                      color: "white",
                      marginBottom: 10,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: "clamp(13px, 3.5vw, 15px)",
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.65,
                      maxWidth: 380,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer
        style={{
          background: "var(--text-primary)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "32px 24px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.color="white"} onMouseOut={(e) => e.currentTarget.style.color="rgba(255,255,255,0.45)"}>Privacy Policy</a>
          <a href="/terms" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.color="white"} onMouseOut={(e) => e.currentTarget.style.color="rgba(255,255,255,0.45)"}>Terms of Service</a>
          <a href="mailto:support@loxlite.com" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.color="white"} onMouseOut={(e) => e.currentTarget.style.color="rgba(255,255,255,0.45)"}>Contact Us</a>
        </div>
        
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          width: "100%", 
          maxWidth: 1000,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 24,
          fontSize: 12
        }}>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
            © 2026 LandingLens
          </span>
          <span>Built by <a href="https://x.com/samteic" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>samteic</a></span>
        </div>
      </footer>
    </main>
  );
}
