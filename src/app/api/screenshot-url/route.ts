import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function signQuery(params: Record<string, string>, secret: string): string {
  const query = new URLSearchParams(params).toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(query)
    .digest("hex");
  return `${query}&signature=${signature}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  const secretKey = process.env.SCREENSHOTONE_SECRET_KEY;

  if (!accessKey || !secretKey) {
    return NextResponse.json(
      { error: "Screenshot service is not configured." },
      { status: 500 },
    );
  }

  const params: Record<string, string> = {
    access_key: accessKey,
    url,
    viewport_width: "1200",
    viewport_height: "900",
    full_page: "true",
    format: "jpg",
    image_quality: "78",
    block_ads: "true",
    block_cookie_banners: "true",
    block_trackers: "true",
  };

  const signedQuery = signQuery(params, secretKey);
  const screenshotUrl = `https://api.screenshotone.com/take?${signedQuery}`;

  return NextResponse.json({ screenshotUrl });
}
