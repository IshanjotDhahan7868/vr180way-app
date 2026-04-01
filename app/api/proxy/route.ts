import { NextResponse } from "next/server";

/**
 * Proxy a website through our domain so we can:
 * 1. Bypass iframe X-Frame-Options / CSP restrictions
 * 2. Inject head-tilt scroll script (same-origin access)
 * 3. Rewrite relative URLs to absolute
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only HTTP/HTTPS URLs allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") || "";

    // For non-HTML content (images, CSS, JS), pass through directly
    if (!contentType.includes("text/html")) {
      const body = await res.arrayBuffer();
      return new NextResponse(body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    let html = await res.text();
    const baseUrl = parsed.origin;

    // Add <base> tag so relative URLs resolve to the original site
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${baseUrl}/">`
    );

    // Inject head-tilt scroll script
    const scrollScript = `
<script>
(function() {
  var scrollSpeed = 0;
  var neutralBeta = null;
  var DEAD_ZONE = 8;
  var MAX_SPEED = 15;

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'vr-scroll') {
      window.scrollBy(0, e.data.dy);
    }
    if (e.data && e.data.type === 'vr-scroll-speed') {
      scrollSpeed = e.data.speed;
    }
  });

  // Also handle direct DeviceOrientation if running in proxy iframe
  function handleOrientation(e) {
    if (e.beta === null) return;
    if (neutralBeta === null) neutralBeta = e.beta;
    var diff = e.beta - neutralBeta;
    if (Math.abs(diff) < DEAD_ZONE) { scrollSpeed = 0; return; }
    var dir = diff > 0 ? 1 : -1;
    var magnitude = Math.min(Math.abs(diff) - DEAD_ZONE, 40) / 40;
    scrollSpeed = dir * magnitude * MAX_SPEED;
  }
  window.addEventListener('deviceorientation', handleOrientation);

  function tick() {
    if (Math.abs(scrollSpeed) > 0.5) {
      window.scrollBy(0, scrollSpeed);
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
</script>`;

    html = html.replace("</body>", scrollScript + "</body>");

    // Remove X-Frame-Options and CSP to allow embedding
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to load page: ${(error as Error).message}` },
      { status: 502 }
    );
  }
}
