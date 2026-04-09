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
