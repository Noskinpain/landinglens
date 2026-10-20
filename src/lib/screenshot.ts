import crypto from "crypto";

function signQuery(params: Record<string, string>, secret: string): string {
  const query = new URLSearchParams(params).toString();
  const signature = crypto
    .createHmac("sha256", secret)
    .update(query)
    .digest("hex");
  return `${query}&signature=${signature}`;
}

export async function captureScreenshot(
  url: string,
  force = false,
): Promise<{ buffer: Buffer; contentType: string }> {
  const cleanUrl = url.replace(/^https?:\/\//i, "").trim();
  const targetUrl = `https://${cleanUrl}`;

  // Option 1: ScreenshotOne (if custom valid API keys are configured)
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  const secretKey = process.env.SCREENSHOTONE_SECRET_KEY;

  if (
    accessKey &&
    secretKey &&
    !accessKey.includes("your_") &&
    !secretKey.includes("your_")
  ) {
    try {
      const params: Record<string, string> = {
        access_key: accessKey,
        url: targetUrl,
        viewport_width: "1280",
        viewport_height: "800",
        full_page: "true",
        format: "jpg",
        image_quality: "80",
        block_ads: "true",
        block_cookie_banners: "true",
        block_trackers: "true",
      };

      const signedQuery = signQuery(params, secretKey);
      const res = await fetch(
        `https://api.screenshotone.com/take?${signedQuery}`,
        {
          cache: force ? "no-store" : "force-cache",
          signal: AbortSignal.timeout(20000),
        },
      );

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/jpeg";
        if (!contentType.includes("application/json")) {
          const ab = await res.arrayBuffer();
          return { buffer: Buffer.from(ab), contentType };
        }
      }
    } catch (err) {
      console.warn("ScreenshotOne unavailable, falling back to free capture engine...", err);
    }
  }

  // Option 2: Thum.io (100% Free, No API Key needed, fast fullpage)
  try {
    const res = await fetch(
      `https://image.thum.io/get/fullpage/${targetUrl}`,
      {
        cache: force ? "no-store" : "force-cache",
        signal: AbortSignal.timeout(18000),
      },
    );

    if (res.ok) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 1500) {
        return { buffer: Buffer.from(ab), contentType: "image/png" };
      }
    }
  } catch (err) {
    console.warn("Thum.io fullpage capture failed, attempting viewport fallback...", err);
  }

  // Option 2b: Thum.io standard viewport (1280x800)
  try {
    const res = await fetch(
      `https://image.thum.io/get/width/1280/crop/800/${targetUrl}`,
      {
        cache: force ? "no-store" : "force-cache",
        signal: AbortSignal.timeout(12000),
      },
    );

    if (res.ok) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 1500) {
        return { buffer: Buffer.from(ab), contentType: "image/png" };
      }
    }
  } catch (err) {
    console.warn("Thum.io viewport capture failed, trying Microlink...", err);
  }

  // Option 3: Microlink API (100% Free, No API Key needed)
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(targetUrl)}&screenshot=true&meta=false&embed=screenshot.url`,
      {
        cache: force ? "no-store" : "force-cache",
        signal: AbortSignal.timeout(20000),
      },
    );

    if (res.ok) {
      const ab = await res.arrayBuffer();
      if (ab.byteLength > 1500) {
        return { buffer: Buffer.from(ab), contentType: "image/png" };
      }
    }
  } catch (err) {
    console.error("Microlink screenshot failed:", err);
  }

  throw new Error(
    `Unable to capture a screenshot of ${targetUrl}. Please check that the URL is live and public.`,
  );
}
