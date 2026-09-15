import { NextResponse } from "next/server";
import { sweepBlobStore } from "@/lib/blob-cleanup";

/**
 * Cron endpoint: enforces the blob TTL and size budget.
 * Triggered by vercel.json cron config.
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls. Fail closed: a missing
  // secret must not leave the endpoint open to anyone.
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sweepBlobStore();
  return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
}
