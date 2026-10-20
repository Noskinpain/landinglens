import { NextRequest, NextResponse } from "next/server";
import { captureScreenshot } from "@/lib/screenshot";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const force = searchParams.get("force") === "true";

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const { buffer, contentType } = await captureScreenshot(url, force);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": force ? "no-store" : "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Screenshot error:", err.message || err);
    return NextResponse.json(
      { error: err.message || "Failed to capture website screenshot." },
      { status: 500 },
    );
  }
}
