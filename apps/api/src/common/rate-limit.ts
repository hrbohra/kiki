/** Fixed-window rate limiter. In-memory (per instance) — fine for a single server; for multi-
 *  instance, back this with Redis (REDIS_URL) using the same interface. Cheap abuse protection. */
interface Window {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly hits = new Map<string, Window>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true if the action is allowed (and counts it); false if the limit is exceeded. */
  check(key: string): boolean {
    const now = Date.now();
    const w = this.hits.get(key);
    if (!w || w.resetAt < now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (w.count >= this.max) return false;
    w.count += 1;
    return true;
  }
}
