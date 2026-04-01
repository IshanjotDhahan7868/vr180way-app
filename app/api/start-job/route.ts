import { NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";
const API_SECRET = process.env.API_SECRET || "";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { blobUrl, originalFilename, warpMode, stretchH, stretchV, cropX, cropY, zoom } = body;

    if (!blobUrl || !originalFilename) {
      return NextResponse.json(
        { error: "Missing blobUrl or originalFilename" },
        { status: 400 }
      );
    }

    if (!["stretch", "pad"].includes(warpMode)) {
      return NextResponse.json(
        { error: "warp_mode must be 'stretch' or 'pad'" },
        { status: 400 }
      );
    }

    // Forward to Render worker
    const workerRes = await fetch(`${WORKER_URL}/api/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
      },
      body: JSON.stringify({
        blob_url: blobUrl,
        original_filename: originalFilename,
        warp_mode: warpMode,
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
