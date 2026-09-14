import { NextResponse } from "next/server";
import { sweepBlobStore } from "@/lib/blob-cleanup";

/**
 * Cron endpoint: enforces the blob TTL and size budget.
 * Triggered by vercel.json cron config.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sweepBlobStore();
  return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
}
