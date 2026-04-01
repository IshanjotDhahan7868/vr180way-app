import { list, del } from "@vercel/blob";
import { NextResponse } from "next/server";

const CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cron endpoint: deletes Vercel Blob files older than 24 hours.
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

  const cutoff = Date.now() - CLEANUP_MAX_AGE_MS;
  let deleted = 0;
  let cursor: string | undefined;

  do {
    const result = await list({ cursor, prefix: "vr180/", limit: 100 });
    const old = result.blobs.filter(
      (b) => new Date(b.uploadedAt).getTime() < cutoff
    );

    if (old.length > 0) {
      await del(old.map((b) => b.url));
      deleted += old.length;
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return NextResponse.json({ deleted, timestamp: new Date().toISOString() });
}
