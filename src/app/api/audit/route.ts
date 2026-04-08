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
                text: `You are a brutally honest conversion expert and YC-level critic reviewing a founder's landing page.

Your job is to analyze this page and return an honest audit. If the page is genuinely good, say so and score it high. If it has serious problems, be brutal and specific.

Return a JSON object with this exact structure:

{
  "score": <number 0-100, honest score based on conversion potential>,
  "grade": <one of: "Conversion killer" | "Needs work" | "Getting there" | "Strong page" | "High converter">,
  "verdict": <2-3 sentence brutal honest summary of the page. Sound like a senior growth expert talking directly to the founder. Use "you" and "your". Be specific about what you actually see.>,
  "stats": {
    "issues_found": <total number of issues found>,
    "critical_count": <number of critical issues>,
    "bounce_estimate": <estimated bounce rate as string e.g. "~65%">,
    "upside": <conversion upside if fixes applied e.g. "+2.4x" for bad pages or "+12%" for good pages>
  },
  "issues": [
    {
      "id": <number>,
      "label": <issue name>,
      "severity": <"critical" | "warning" | "good">,
      "score": <number 1-10>,
      "roast": <1-2 sentences. Brutal, specific, references actual elements visible on the page. No generic advice.>,
      "fix": <1 sentence concrete fix or rewrite suggestion. Actionable.>
    }
  ]
}

Rules for issues:
- Return ONLY real issues you actually see - between 3 and 10 issues total
- Rank them by severity - critical first, then warning, then good
- For high-scoring pages, include what is working well as "good" severity items
- NEVER give generic advice - reference specific text, colors, button labels, or layout choices you see
- Score each issue honestly - a great headline gets 9/10, a terrible one gets 2/10
- "critical" = actively killing conversions
- "warning" = hurting but not fatal
- "good" = working well, worth acknowledging

Respond ONLY with raw valid JSON. No markdown, no backticks, no explanation.`,
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
