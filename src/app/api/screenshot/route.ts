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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY!;
    const secretKey = process.env.SCREENSHOTONE_SECRET_KEY!;

    const params: Record<string, string> = {
      access_key: accessKey,
      url: url,
      viewport_width: "1200",
      viewport_height: "900",
      full_page: "false",
      format: "jpg",
      image_quality: "78",
      block_ads: "true",
      block_cookie_banners: "true",
      block_trackers: "true",
    };

    const signedQuery = signQuery(params, secretKey);
    const screenshotUrl = `https://api.screenshotone.com/take?${signedQuery}`;

    const response = await axios.get(screenshotUrl, {
      responseType: "arraybuffer",
      timeout: 25000,
    });

    // Check if response is JSON (error) instead of an image
    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      const decoded = Buffer.from(response.data).toString("utf-8");
      const parsed = JSON.parse(decoded);
      const errorCode = parsed?.error_code || "unknown";

      if (errorCode === "name_not_resolved") {
        return NextResponse.json(
          {
            error:
              "URL does not exist. Please check the address and try again.",
          },
          { status: 422 },
        );
      }

      return NextResponse.json(
        { error: parsed?.error_message || "Screenshot failed." },
        { status: 500 },
      );
    }

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    if (err.code === "ECONNABORTED") {
      return NextResponse.json(
        { error: "Screenshot timed out. Please try again." },
        { status: 504 },
      );
    }

    if (err.response?.data) {
      const decoded = Buffer.from(err.response.data).toString("utf-8");
      try {
        const parsed = JSON.parse(decoded);
        const errorCode = parsed?.error_code || "unknown";

        if (errorCode === "name_not_resolved") {
          return NextResponse.json(
            {
              error:
                "URL does not exist. Please check the address and try again.",
            },
            { status: 422 },
          );
        }

        return NextResponse.json(
          { error: parsed?.error_message || "Screenshot failed." },
          { status: 500 },
        );
      } catch {
        return NextResponse.json(
          { error: "Screenshot failed." },
          { status: 500 },
        );
      }
    }

    console.error("Screenshot error:", err.message);
    return NextResponse.json({ error: "Screenshot failed." }, { status: 500 });
  }
}
