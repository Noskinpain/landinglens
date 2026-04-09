import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";

function signQuery(params: Record<string, string>, secret: string): string {
  const query = new URLSearchParams(params).toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(query)
    .digest("hex");
  return `${query}&signature=${signature}`;
}

async function takeScreenshot(url: string) {
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
  const response = await axios.get<ArrayBuffer>(screenshotUrl, {
    responseType: "arraybuffer",
    timeout: 25000,
  });

  const contentType = response.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    const decoded = Buffer.from(response.data).toString("utf-8");
    const parsed = JSON.parse(decoded);
    throw new Error(parsed?.error_message || "Screenshot failed.");
  }

  const base64 = Buffer.from(response.data).toString("base64");
  return {
    base64,
  };
}

async function analyzeScreenshot(screenshotBase64: string) {
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
    "bounce_estimate": <estimated bounce rate as string e.g. "~65%">,
    "upside": <conversion upside if fixes applied e.g. "+2.4x" or "+12%">
  },
  "issues": [
    {
      "id": <number>,
      "label": <2-4 word simple issue name e.g. "Headline is confusing", "Invisible Button", "Wall of Text">,
      "severity": <"critical" | "warning" | "good">,
      "score": <number 1-10>,
      "roast": <1-2 sentences. Brutal, plain-English explanation of why this part sucks or works. Reference the exact text or color on the screen. No fluff.>,
      "fix": <1 sentence concrete, dead-simple fix. What exactly should they change right now?>
    }
  ]
}

Rules for issues:
- Return 3-8 issues total. Focus on the real reasons people leave the site.
- Never use generic text like "needs better UI" -> say "the gray text on a white background is impossible to read."
- Never just say "make it pop" -> say "your main button is the same color as your background, change it to a bright contrast color."
- "critical" = making people leave immediately
- "warning" = annoying but not a dealbreaker
- "good" = actually working well

Respond ONLY with raw valid JSON. No markdown, no backticks.`,
              },
            ],
          },
        ],
      }),
      cache: "no-store",
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const screenshot = await takeScreenshot(url);
    const result = await analyzeScreenshot(screenshot.base64);

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
