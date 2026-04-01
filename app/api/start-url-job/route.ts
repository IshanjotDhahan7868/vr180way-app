import { NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";
const API_SECRET = process.env.API_SECRET || "";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { youtubeUrl, warpMode, projection, quality, resolution, stretchH, stretchV, cropX, cropY, zoom } = body;

    if (!youtubeUrl) {
      return NextResponse.json({ error: "Missing YouTube URL" }, { status: 400 });
    }

    const urlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/;
    if (!urlPattern.test(youtubeUrl)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const workerRes = await fetch(`${WORKER_URL}/api/process-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
      },
      body: JSON.stringify({
        youtube_url: youtubeUrl,
        warp_mode: warpMode ?? "pad",
        projection: projection ?? "vr180",
        quality: quality ?? "balanced",
        resolution: resolution ?? "720p",
        stretch_h: stretchH ?? 1.0,
        stretch_v: stretchV ?? 1.0,
        crop_x: cropX ?? 0.0,
        crop_y: cropY ?? 0.0,
        zoom: zoom ?? 1.0,
      }),
    });

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      const status = workerRes.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: status === 429 ? "Server busy — try again in a few minutes" : `Worker error: ${errText}` },
        { status }
      );
    }

    const data = await workerRes.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to start job: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
