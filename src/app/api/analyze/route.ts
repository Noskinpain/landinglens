import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const force = req.nextUrl.searchParams.get("force") === "true";
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
  ]
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
