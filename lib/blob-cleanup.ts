import { list, del } from "@vercel/blob";

/** Blobs older than this are removed on every sweep. */
export const MAX_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * Hard ceiling for the store. The Hobby Blob allowance is 1 GB; staying well
 * under it leaves room for an in-flight upload between sweeps.
 */
export const MAX_TOTAL_BYTES = 600 * 1024 * 1024;

type Entry = { url: string; size: number; uploadedAt: number };

async function listAll(): Promise<Entry[]> {
  const entries: Entry[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({ cursor, limit: 1000 });
    for (const b of result.blobs) {
      entries.push({
        url: b.url,
        size: b.size,
        uploadedAt: new Date(b.uploadedAt).getTime(),
      });
    }
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return entries;
}

async function removeAll(urls: string[]) {
  for (let i = 0; i < urls.length; i += 100) {
    await del(urls.slice(i, i + 100));
  }
}

/**
 * Deletes expired blobs, then keeps deleting oldest-first until the store is
 * back under MAX_TOTAL_BYTES. Scans the whole store — uploads land at whatever
 * pathname the client chose, so filtering by prefix silently misses them.
 */
export async function sweepBlobStore() {
  const cutoff = Date.now() - MAX_AGE_MS;
  const all = await listAll();

  const expired = all.filter((b) => b.uploadedAt < cutoff);
  await removeAll(expired.map((b) => b.url));

  const expiredUrls = new Set(expired.map((b) => b.url));
  const remaining = all
    .filter((b) => !expiredUrls.has(b.url))
    .sort((a, b) => a.uploadedAt - b.uploadedAt);

  let total = remaining.reduce((sum, b) => sum + b.size, 0);
  const overBudget: string[] = [];
  for (const b of remaining) {
    if (total <= MAX_TOTAL_BYTES) break;
    overBudget.push(b.url);
    total -= b.size;
  }
  await removeAll(overBudget);

  return {
    scanned: all.length,
    deletedExpired: expired.length,
    deletedOverBudget: overBudget.length,
    remainingBytes: total,
  };
}
