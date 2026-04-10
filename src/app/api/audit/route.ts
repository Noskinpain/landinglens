import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

export const maxDuration = 60;
import crypto from "crypto";

function signQuery(params: Record<string, string>, secret: string): string {
  const query = new URLSearchParams(params).toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(query)
    .digest("hex");
  return `${query}&signature=${signature}`;
}

async function takeScreenshot(url: string, force: boolean) {
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  const secretKey = process.env.SCREENSHOTONE_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("Screenshot service is not configured.");
  }

  const params: Record<string, string> = {
    access_key: accessKey,
    url,
    viewport_width: "1280",
    viewport_height: "800",
    full_page: "true",
    format: "jpg",
    image_quality: "90",
    block_ads: "true",
    block_cookie_banners: "true",
    block_trackers: "true",
  };

  const signedQuery = signQuery(params, secretKey);
  const screenshotUrl = `https://api.screenshotone.com/take?${signedQuery}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  
  const response = await fetch(screenshotUrl, {
    cache: force ? "no-store" : "force-cache",
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    throw new Error(data?.error_message || "Screenshot failed.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  
  return {
    base64,
  };
}

async function analyzeScreenshot(screenshotBase64: string, force: boolean) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 2000,
        temperature: 0.3,
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
                text: `You are a brutally honest, straight-talking conversion expert and startup roaster. You hate marketing fluff and academic jargon. You speak in punchy, plain English that anyone can understand, but your insights are razor-sharp. 

Your job is to provide a unique, no-BS audit that exposes exactly why a page isn't getting signups (or why it's great) by pointing out painfully obvious but commonly missed flaws.

EVALUATION PATTERN:
1. Explain the problem like you're talking to a founder over coffee. Be brutal but perfectly clear.
2. Focus on specific things: Is the headline confusing? Is there a wall of text? Does the button blend into the background? Is there a lack of trust because there are no reviews?
3. NEVER use big academic words (no "heuristics", "salience", "Hick's Law", or "cognitive load"). Use plain English (e.g., "Invisible button", "Too much reading", "Confusing intro", "No proof anyone uses this").

Return a JSON object with this exact structure:

{
  "score": <number 0-100, accurate evaluation. 90+ for amazing pages, below 40 for disasters.>,
  "grade": <one of: "Conversion killer" | "Needs work" | "Getting there" | "Strong page" | "High converter">,
  "verdict": <2-3 sentence brutal, honest summary. Speak like a smart friend cutting through the noise. Start by stating the main problem (e.g. "You get traffic, but nobody knows what you actually do"). Use "you" and "your". Keep the language simple but the insight deep.>,
  "stats": {
    "issues_found": <total number of issues found>,
    "critical_count": <number of critical issues>,
    "main_bottleneck": <2-4 words. Be brutally specific (e.g. "Confusing value proposition", "Headline is invisible", "Boring wall of text").>,
    "bottleneck_impact": <4-8 words. Explain the consequence. (e.g. "Visitors don't understand what you do -> they leave").>,
    "quick_win": <2-4 words. The easiest actionable change. (e.g. "Simplify headline", "Add a bold CTA").>,
    "quick_win_detail": <4-8 words. Explain what to do exactly. (e.g. "Make the expected outcome obvious in 5 seconds").>
  },
  "teardown": [
    {
      "section_name": <e.g. "Hero Section", "Value Proposition", "Social Proof", "Objection Handling", "Call to Action">,
      "status": <"pass" | "fail">,
      "analysis": <3-4 sentences of deep dive analysis of this specific section. Identify exact text, colors, and layout blocks. Brutal and plain-English. Highlight what works well too.>,
      "fix": <concrete, actionable prescription for this section. What exactly should they change right now?>
    }
  ],
  "comprehensive_playbook": <4-5 paragraphs. A deep, high-value, step-by-step conversion roadmap. This is the premium PDF report content. Detail exactly what they should do this week, next week, and in 30 days to fix their site.>
}

Rules for teardown sections:
- Provide 4-6 sections total (a complete teardown of the page top to bottom).
- Never use generic text like "needs better UI" -> say "the gray text on a white background is impossible to read."
- If the page is great, mark sections as "pass" and give them immense credit for what they did right, while offering minor optimizations.
- If it's bad, mark "fail" and explain exactly why people are leaving.

Respond ONLY with raw valid JSON. No markdown, no backticks.`,
              },
            ],
          },
        ],
      }),
      cache: force ? "no-store" : "force-cache",
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Analysis failed.");
  }

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("No response from model.");
  }

  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

const getCachedAuditForUrl = unstable_cache(
  async (targetUrl: string) => {
    const screenshot = await takeScreenshot(targetUrl, false);
    return await analyzeScreenshot(screenshot.base64, false);
  },
  ["url-audit-v1"],
  { revalidate: false }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const force = searchParams.get("force") === "true";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    let result;
    if (force) {
      const screenshot = await takeScreenshot(url, true);
      result = await analyzeScreenshot(screenshot.base64, true);
    } else {
      result = await getCachedAuditForUrl(url);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    if (error?.code === "ECONNABORTED") {
      return NextResponse.json(
        { error: "Screenshot timed out. Please try again." },
        { status: 504 },
      );
    }

    console.error("Audit route error:", error);
    return NextResponse.json(
      { error: error?.message || "Audit failed." },
      { status: 500 },
    );
  }
}
