/** Simple in-memory cache with TTL — prevents hammering MySQL on 3s polling. */

type CacheEntry<T> = { data: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

/**
 * Get from cache or compute & store.
 * Concurrent requests for the same key share one database promise.
 * @param key   Unique cache key
 * @param ttlMs Time-to-live in milliseconds (default 5000 = 5 seconds)
 * @param fn    Factory function that returns fresh data
 */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && now < hit.expiresAt) return hit.data;

  const running = pending.get(key) as Promise<T> | undefined;
  if (running) return running;

  const request = fn()
    .then((data) => {
      store.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

/** Clear all cache entries (e.g. after manual refresh). */
export function clearCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    pending.clear();
    return;
  }
  Array.from(store.keys()).forEach((key) => {
    if (key.startsWith(prefix)) store.delete(key);
  });
  Array.from(pending.keys()).forEach((key) => {
    if (key.startsWith(prefix)) pending.delete(key);
  });
}
