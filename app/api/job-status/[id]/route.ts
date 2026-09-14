import { NextResponse } from "next/server";
import { sweepBlobStore } from "@/lib/blob-cleanup";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";
const API_SECRET = process.env.API_SECRET || "";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const workerRes = await fetch(`${WORKER_URL}/api/status/${id}`, {
      headers: {
        ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
      },
      // Don't cache status responses
      cache: "no-store",
    });

    if (!workerRes.ok) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: workerRes.status }
      );
    }

    const data = await workerRes.json();

    // A finished job means its source upload is dead weight. The daily cron is
    // the backstop; sweeping here keeps the store near-empty between runs.
    if (data.status === "completed" || data.status === "failed") {
      void sweepBlobStore().catch(() => {});
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Worker unavailable" },
      { status: 502 }
    );
  }
}
