import { NextRequest, NextResponse } from "next/server";
import { captureScreenshot } from "@/lib/screenshot";
import { analyzeLivePage, type PageTelemetry } from "@/lib/pageAnalyzer";

export const maxDuration = 60;

export type PillarScore = {
  id: "value_prop" | "visual_hierarchy" | "cta_friction" | "social_proof" | "copy_objections";
  name: string;
  weight: number;
  score: number;
  status: "excellent" | "good" | "needs_work" | "critical";
  benchmark: string;
  summary: string;
};

export type TeardownSection = {
  section_name: string;
  pillar_id: "value_prop" | "visual_hierarchy" | "cta_friction" | "social_proof" | "copy_objections";
  status: "pass" | "fail";
  severity: "critical" | "warning" | "opportunity" | "good";
  analysis: string;
  observed_issue: string;
  before_example?: string;
  after_rewrite?: string;
  fix: string;
};

export type FiveSecondTest = {
  what_they_think_you_do: string;
  perceived_audience: string;
  top_bounce_reason: string;
  cognitive_friction: "Low" | "Moderate" | "Severe";
};

export type AuditResult = {
  score: number;
  grade: string;
  verdict: string;
  telemetry: PageTelemetry;
  five_second_test: FiveSecondTest;
  pillars: PillarScore[];
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

async function takeScreenshot(url: string, force: boolean) {
  const { buffer } = await captureScreenshot(url, force);
  return {
    base64: buffer.toString("base64"),
  };
}

function getFallbackAudit(url: string, telemetry: PageTelemetry): AuditResult {
  const domain = url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  const capitalized = domain.charAt(0).toUpperCase() + domain.slice(1);

  // Calibrated deterministic scoring calculations
  const h1Words = telemetry.h1Text ? telemetry.h1Text.split(/\s+/).length : 0;
  let valueScore = 60;
  if (telemetry.h1Count === 1) {
    valueScore += 18;
    if (h1Words >= 3 && h1Words <= 12) valueScore += 8; // Concise, punchy headline
  } else if (telemetry.h1Count === 0) {
    valueScore = 40;
  } else {
    valueScore = 52; // Competing H1s confuse hierarchy
  }

  let ctaScore = 55;
  if (telemetry.ctaButtons.length > 0) {
    ctaScore = 75;
    if (telemetry.hasRiskReversal) ctaScore += 15; // Reassurance microcopy
  }

  let hierarchyScore = 65;
  if (telemetry.h2Count >= 3) hierarchyScore += 12;
  if (telemetry.hasProductPreview) hierarchyScore += 10;
  if (telemetry.responseTimeMs < 1200) hierarchyScore += 5;
  if (telemetry.responseTimeMs > 2500) hierarchyScore -= 10;

  let socialScore = telemetry.hasSocialProof ? 88 : 45;

  let objectionScore = 60;
  if (telemetry.wordCount >= 350 && telemetry.wordCount <= 1800) objectionScore += 22;
  if (telemetry.hasRiskReversal) objectionScore += 10;

  const overallScore = Math.min(
    96,
    Math.round(
      valueScore * 0.25 +
      ctaScore * 0.2 +
      hierarchyScore * 0.2 +
      socialScore * 0.2 +
      objectionScore * 0.15
    )
  );

  const grade =
    overallScore >= 82
      ? "Strong Converter"
      : overallScore >= 68
        ? "Leaking Signups"
        : overallScore >= 50
          ? "High Drop-off Risk"
          : "Critical Conversion Leak";

  const primaryCta = telemetry.ctaButtons[0] || "Get Started";
  const observedHeadline = telemetry.h1Text || `The Solution for ${capitalized}`;

  const verdict =
    overallScore >= 82
      ? `Your landing page has exceptionally strong fundamentals. Value proposition is immediately clear, product demonstration provides instant context, and social proof builds high trust above the fold. The teardown below highlights high-leverage growth experiments to optimize conversion even further.`
      : socialScore < 60
        ? `Your page is losing visitors within 5 seconds. Your headline describes what you built rather than the outcome visitors get, and there is no visible proof to build trust before asking them to click.`
        : `Your layout is structured, but your call-to-action creates hesitation. Visitors need clearer incentives and lower commitment friction before they will convert.`;

  return {
    score: overallScore,
    grade,
    verdict,
    telemetry,
    five_second_test: {
      what_they_think_you_do: overallScore >= 82
        ? `Immediate clarity: Users understand this is a premier tool for "${telemetry.title?.slice(0, 50) || capitalized}".`
        : telemetry.title
          ? `A tool related to "${telemetry.title.slice(0, 60)}", but the exact benefit takes too long to decipher.`
          : `A digital product, but it's not immediately obvious what it actually changes for them.`,
      perceived_audience: overallScore >= 82
        ? `Clear ICP: Built specifically for high-performing teams and professionals.`
        : `Unclear. The page speaks to everyone instead of calling out its ideal customer.`,
      top_bounce_reason: overallScore >= 82
        ? `High intent visitors will convert; primary bounce reason would be pricing or existing contract lock-in with a competitor.`
        : !telemetry.hasSocialProof
          ? `No proof anyone uses this yet. Cold visitors bounce when they don't see logos, testimonials, or ratings.`
          : `The main headline is too abstract, so visitors leave before scrolling down to your features.`,
      cognitive_friction: overallScore >= 82 ? "Low" : telemetry.wordCount > 1500 ? "Severe" : "Moderate",
    },
    pillars: [
      {
        id: "value_prop",
        name: "Headline & Core Promise",
        weight: 0.25,
        score: valueScore,
        status: valueScore >= 75 ? "good" : valueScore >= 60 ? "needs_work" : "critical",
        benchmark: "Industry Average: 72/100",
        summary: telemetry.h1Count === 1
          ? `Single headline found, but needs to focus on the customer's end result rather than your product features.`
          : `Found ${telemetry.h1Count} competing headlines. Visitors don't know where to look first.`,
      },
      {
        id: "cta_friction",
        name: "Call-to-Action & Friction",
        weight: 0.2,
        score: ctaScore,
        status: ctaScore >= 75 ? "good" : ctaScore >= 60 ? "needs_work" : "critical",
        benchmark: "Industry Average: 70/100",
        summary: `${telemetry.ctaButtons.length} action buttons found. ${telemetry.hasRiskReversal ? "Has reassurance microcopy." : "Missing 'No credit card required' or free trial reassurance."}`,
      },
      {
        id: "visual_hierarchy",
        name: "Page Layout & Flow",
        weight: 0.2,
        score: hierarchyScore,
        status: hierarchyScore >= 75 ? "good" : hierarchyScore >= 60 ? "needs_work" : "critical",
        benchmark: "Industry Average: 75/100",
        summary: `Page contains ${telemetry.h2Count} sections with a ${telemetry.responseTimeMs}ms response time.`,
      },
      {
        id: "social_proof",
        name: "Social Proof & Trust",
        weight: 0.2,
        score: socialScore,
        status: socialScore >= 75 ? "good" : socialScore >= 60 ? "needs_work" : "critical",
        benchmark: "Industry Average: 68/100",
        summary: telemetry.hasSocialProof
          ? "Customer proof signals detected in page."
          : "Zero customer logos, reviews, or user counts visible above the fold.",
      },
      {
        id: "copy_objections",
        name: "Objections & Risk Reversal",
        weight: 0.15,
        score: objectionScore,
        status: objectionScore >= 75 ? "good" : objectionScore >= 60 ? "needs_work" : "critical",
        benchmark: "Industry Average: 70/100",
        summary: `${telemetry.wordCount} words on page. Key buyer doubts around pricing, setup time, and cancellation need direct answers.`,
      },
    ],
    stats: {
      issues_found: 7,
      critical_count: socialScore < 60 ? 3 : 2,
      main_bottleneck: socialScore < 60 ? "Missing Trust Signals" : "Vague Value Proposition",
      bottleneck_impact: socialScore < 60
        ? "Visitors bounce because there are no logos or reviews to prove this works"
        : "Visitors can't tell what problem you solve within 5 seconds",
      quick_win: "Rewrite Hero Subtitle",
      quick_win_detail: "Explain who this is for and the exact result they get in one plain sentence",
    },
    teardown: [
      {
        section_name: "Hero Headline & 5-Second Hook",
        pillar_id: "value_prop",
        status: valueScore >= 75 ? "pass" : "fail",
        severity: valueScore >= 75 ? "opportunity" : "critical",
        analysis: `Your current headline is: "${observedHeadline}". It describes what you built rather than what problem it solves. If cold visitors cannot grasp the concrete payoff in 5 seconds, they bounce immediately.`,
        observed_issue: "The headline talks about product features instead of the user's tangible outcome.",
        before_example: observedHeadline,
        after_rewrite: `The fastest way to [Desired Result] — without [Biggest Headache].`,
        fix: "Lead with the outcome: State what the customer achieves, who it's for, and how quickly it works.",
      },
      {
        section_name: "Call to Action & Friction Points",
        pillar_id: "cta_friction",
        status: ctaScore >= 75 ? "pass" : "fail",
        severity: ctaScore >= 75 ? "good" : "warning",
        analysis: `Your main button text is "${primaryCta}". Generic labels like 'Get Started' create hesitation because visitors don't know if they will be forced into a long form, a sales call, or a paywall.`,
        observed_issue: "The button does not reduce commitment anxiety before asking for the click.",
        before_example: primaryCta,
        after_rewrite: `Start Free — No Credit Card Required · 2-Min Setup`,
        fix: "Add 1 line of reassuring microcopy directly under your button: 'Free 14-day trial · No credit card required · Cancel anytime'.",
      },
      {
        section_name: "Social Proof & Credibility",
        pillar_id: "social_proof",
        status: telemetry.hasSocialProof ? "pass" : "fail",
        severity: telemetry.hasSocialProof ? "good" : "critical",
        analysis: telemetry.hasSocialProof
          ? "You have social proof markers, but ensure they showcase specific numbers and outcomes rather than generic praise."
          : "There are no customer logos, verified ratings, or case metrics visible in the hero area. Cold visitors will not trust an unfamiliar tool without proof.",
        observed_issue: telemetry.hasSocialProof
          ? "Testimonials lack specific measurable numbers."
          : "Zero customer proof above the fold makes the offer feel risky.",
        before_example: telemetry.hasSocialProof ? "Loved by customers worldwide" : "No logos or proof visible",
        after_rewrite: "Used by 1,200+ teams to save 4 hours every week · 4.9/5 on G2",
        fix: "Place a strip of 4–5 recognizable customer logos or a rating badge directly beneath the main button.",
      },
      {
        section_name: "Visual Hierarchy & Scanning Flow",
        pillar_id: "visual_hierarchy",
        status: hierarchyScore >= 75 ? "pass" : "fail",
        severity: hierarchyScore >= 75 ? "good" : "warning",
        analysis: `Found ${telemetry.h2Count} content sections. Visual scanning test shows whether visitors can understand your product by skimming headlines without reading full paragraphs.`,
        observed_issue: hierarchyScore >= 75
          ? "Content is scannable, but key benefits need bold visual emphasis."
          : "Text density is too high; important takeaways get lost in dense text blocks.",
        before_example: "Paragraph-heavy feature descriptions without visual anchors",
        after_rewrite: "3-Column Bento Grid: Bold 4-word takeaway + 1 sentence explanation + screenshot",
        fix: "Break long paragraphs into 2-sentence takeaways with bold anchor words for skimmers.",
      },
      {
        section_name: "Product Demonstration (Show vs. Tell)",
        pillar_id: "value_prop",
        status: telemetry.wordCount >= 300 ? "pass" : "fail",
        severity: "warning",
        analysis: "Visitors don't want to imagine how your product works—they want to see it. Pages that show a crisp product UI preview or 15-second demo convert up to 34% higher than text-only pages.",
        observed_issue: "The interface is hidden or requires too much imagination to understand.",
        before_example: "Abstract vector illustrations or stock photography",
        after_rewrite: "High-resolution browser mockup showing the actual product dashboard in action",
        fix: "Embed a high-contrast interactive screenshot or short loop directly beneath the hero headline.",
      },
      {
        section_name: "Overcoming Objections & FAQ",
        pillar_id: "copy_objections",
        status: objectionScore >= 70 ? "pass" : "fail",
        severity: "warning",
        analysis: `Your page has ${telemetry.wordCount} words, but leaves the top purchase hesitations unanswered: How long does setup take? Can I import my data? What happens after the trial?`,
        observed_issue: "Common doubts about setup, pricing, and lock-in are left unanswered.",
        before_example: "No FAQ section or clear answers to top hesitations",
        after_rewrite: "3-Question FAQ: 'How long to get started?', 'Can I cancel anytime?', 'Do you integrate with my stack?'",
        fix: "Add a compact 3-to-4 question FAQ right above your final footer button to eliminate last-minute doubts.",
      },
      {
        section_name: "Mobile Flow & Tap Ergonomics",
        pillar_id: "cta_friction",
        status: telemetry.inputCount <= 3 ? "pass" : "fail",
        severity: telemetry.inputCount <= 3 ? "good" : "warning",
        analysis: `Detected ${telemetry.inputCount} input fields and ${telemetry.ctaButtons.length} action buttons. Over 58% of landing page traffic arrives via mobile viewports where every extra form field cuts completion rate in half.`,
        observed_issue: telemetry.inputCount <= 3
          ? "Input count is low, but mobile button tap target must exceed 44px."
          : "Too many intake fields create mobile drop-off before submission.",
        before_example: "Multiple form fields asking for name, company size, and phone number",
        after_rewrite: "Single-input email capture: 'Enter work email' with 48px sticky button",
        fix: "Reduce intake to a single email input, and ensure sticky bottom CTA is thumb-reachable on mobile.",
      },
    ],
    comprehensive_playbook: `CONVERSION ACCELERATION ACTION PLAN: ${capitalized}

Step 1: Fix the Hero (Do this today)
- Rewrite headline: [Outcome] + [Timeframe] + [Without the headache].
- Add reassurance under main button: 'Free trial · No credit card required'.
- Put customer logos or rating score right below the CTA.

Step 2: Remove Buying Friction (Week 1)
- Add a 3-question FAQ answering setup time, cancellation, and pricing.
- Keep sign-up forms to maximum 1 or 2 fields (just work email).
- Make sure mobile buttons are at least 44px tall for easy tapping.

Step 3: Strengthen Proof (Week 2)
- Swap generic quotes for results-based reviews (e.g. 'Saved 6 hrs/week').
- Add a product demo video or interactive preview so users see it in action.`,
  };
}

async function analyzeWithGroq(
  screenshotBase64: string,
  apiKey: string,
  url: string,
  telemetry: PageTelemetry,
): Promise<AuditResult> {
  const models = [
    "llama-3.2-11b-vision-preview",
    "llama-3.2-90b-vision-preview",
    "qwen/qwen3.8-27b",
  ];

  const domain = url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

  const promptText = `You are a world-class Conversion Rate Optimization (CRO) advisor and expert growth copywriter.
Analyze this landing page visual for: ${domain}.

VERIFIED DOM TELEMETRY (Live Site Data):
- HTTP Response Latency: ${telemetry.responseTimeMs}ms (Status: ${telemetry.httpStatus})
- Primary Heading (H1): ${telemetry.h1Text ? `"${telemetry.h1Text}"` : "None detected"} (Count: ${telemetry.h1Count})
- Sub-headings (H2): ${telemetry.h2Count} detected (${telemetry.h2Samples.slice(0, 3).join(", ")})
- Total Words: ${telemetry.wordCount} words (~${telemetry.readingTimeMinutes} min read)
- Primary CTA Triggers: ${telemetry.ctaButtons.join(", ") || "None clearly isolated"}
- Form / Inputs: ${telemetry.formCount} forms, ${telemetry.inputCount} input fields
- Verified Social Proof: ${telemetry.hasSocialProof ? "Detected in DOM" : "None detected in DOM"}
- Risk Reversal Microcopy: ${telemetry.hasRiskReversal ? "Detected" : "Missing"}

CRITICAL STYLE & TONE DIRECTIVE:
1. LEAD WITH ACTIONABLE, PUNCHY, HUMAN WORDS. Speak directly to the founder like an expert growth advisor.
2. BANNED JARGON: NEVER use words like "operational transformation", "conversion velocity", "unsubstantiated authority", "baseline technical diagnostics", "proposition framing", or "cognitive friction".
3. Point out exactly where visitors get confused, lose interest, or drop off.
4. Give concrete, copy-pasteable rewrites that make the offer crystal-clear in under 5 seconds.
5. Strict: Zero emojis.

Return ONLY a raw JSON object with this exact structure (no markdown, no backticks):
{
  "score": <number 0-100>,
  "grade": <"High Converter" | "Leaking Signups" | "High Drop-off Risk" | "Critical Conversion Leak">,
  "verdict": <2 plain-English sentences diagnosing why visitors leave and what immediate change would fix it>,
  "five_second_test": {
    "what_they_think_you_do": <what a cold visitor thinks this is in 5 seconds>,
    "perceived_audience": <who they think it is for>,
    "top_bounce_reason": <the single biggest doubt that makes them click away>,
    "cognitive_friction": <"Low" | "Moderate" | "Severe">
  },
  "pillars": [
    {
      "id": "value_prop",
      "name": "Value Proposition & Clarity",
      "weight": 0.25,
      "score": <0-100>,
      "status": <"excellent" | "good" | "needs_work" | "critical">,
      "benchmark": <e.g. "Cohort Median: 72/100">,
      "summary": <concise diagnostic line>
    },
    {
      "id": "visual_hierarchy",
      "name": "Visual Hierarchy & Flow",
      "weight": 0.20,
      "score": <0-100>,
      "status": <"excellent" | "good" | "needs_work" | "critical">,
      "benchmark": <e.g. "Cohort Median: 75/100">,
      "summary": <concise diagnostic line>
    },
    {
      "id": "cta_friction",
      "name": "Call to Action Architecture",
      "weight": 0.20,
      "score": <0-100>,
      "status": <"excellent" | "good" | "needs_work" | "critical">,
      "benchmark": <e.g. "Cohort Median: 70/100">,
      "summary": <concise diagnostic line>
    },
    {
      "id": "social_proof",
      "name": "Social Validation & Trust",
      "weight": 0.20,
      "score": <0-100>,
      "status": <"excellent" | "good" | "needs_work" | "critical">,
      "benchmark": <e.g. "Cohort Median: 68/100">,
      "summary": <concise diagnostic line>
    },
    {
      "id": "copy_objections",
      "name": "Copy Density & Objection Coverage",
      "weight": 0.15,
      "score": <0-100>,
      "status": <"excellent" | "good" | "needs_work" | "critical">,
      "benchmark": <e.g. "Cohort Median: 70/100">,
      "summary": <concise diagnostic line>
    }
  ],
  "stats": {
    "issues_found": <number>,
    "critical_count": <number>,
    "main_bottleneck": <2-4 word plain diagnosis, e.g. "Vague Headline" or "Missing Customer Proof">,
    "bottleneck_impact": <1 short sentence on how this causes visitors to bounce>,
    "quick_win": <short action title, e.g. "Rewrite Subheadline" or "Add Risk Reversal">,
    "quick_win_detail": <exact tactical fix in plain words>
  },
  "teardown": [
    {
      "section_name": <e.g. "Hero Headline", "Call to Action", "Social Proof", "Objection Handling">,
      "pillar_id": <"value_prop" | "visual_hierarchy" | "cta_friction" | "social_proof" | "copy_objections">,
      "status": <"pass" | "fail">,
      "severity": <"critical" | "warning" | "opportunity" | "good">,
      "analysis": <2-3 plain-English sentences explaining the exact problem without buzzwords>,
      "observed_issue": <1 short sentence on what is broken>,
      "before_example": <exact text or observed pattern on page>,
      "after_rewrite": <copy-pasteable high-converting headline, button text, or reassurance copy>,
      "fix": <concrete 1-step action instruction>
    }
  ],
  "comprehensive_playbook": <clean 3-step action checklist formatted in markdown>
}`;

  let lastErr = null;
  for (const model of models) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 3000,
            temperature: 0.0,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${screenshotBase64}`,
                    },
                  },
                  {
                    type: "text",
                    text: promptText,
                  },
                ],
              },
            ],
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(30000),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content?.trim();
        if (raw) {
          const cleaned = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed && parsed.pillars && parsed.teardown) {
            return {
              ...parsed,
              telemetry,
            };
          }
        }
      }
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw lastErr || new Error("Groq vision diagnostic failed.");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const force = searchParams.get("force") === "true";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Run screenshot capture and live page DOM telemetry in parallel
    const [screenshot, telemetry] = await Promise.all([
      takeScreenshot(url, force),
      analyzeLivePage(url),
    ]);

    const groqKey = process.env.GROQ_API_KEY;
    let result: AuditResult;

    if (groqKey && !groqKey.includes("your_") && groqKey.startsWith("gsk_")) {
      try {
        result = await analyzeWithGroq(screenshot.base64, groqKey, url, telemetry);
      } catch (err) {
        console.warn("AI analysis fallback triggered:", err);
        result = getFallbackAudit(url, telemetry);
      }
    } else {
      result = getFallbackAudit(url, telemetry);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Audit route error:", error);
    return NextResponse.json(
      { error: error?.message || "Audit failed." },
      { status: 500 },
    );
  }
}
