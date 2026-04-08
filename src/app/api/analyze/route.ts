import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { screenshotBase64 } = await req.json();

    if (!screenshotBase64) {
      return NextResponse.json(
        { error: "Screenshot is required" },
        { status: 400 },
      );
    }

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
- Return ONLY real issues you actually see — between 3 and 10 issues total
- Rank them by severity — critical first, then warning, then good
- For high-scoring pages, include what is working well as "good" severity items
- NEVER give generic advice — reference specific text, colors, button labels, or layout choices you see
- Score each issue honestly — a great headline gets 9/10, a terrible one gets 2/10
- "critical" = actively killing conversions
- "warning" = hurting but not fatal  
- "good" = working well, worth acknowledging

Respond ONLY with raw valid JSON. No markdown, no backticks, no explanation.`,
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Groq API failed" }, { status: 500 });
    }

    const raw = data.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 500 },
      );
    }

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
