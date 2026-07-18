import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { RateLimiter } from './rate-limit';

export interface UpstashRateLimiterOptions {
  readonly url: string;
  readonly token: string;
  /** Requests per IP per window. */
  readonly perIp?: { readonly requests: number; readonly windowSeconds: number };
  /** The hard global cap: total requests served per UTC day. */
  readonly dailyCap?: number;
}

export function createUpstashRateLimiter(options: UpstashRateLimiterOptions): RateLimiter {
  const redis = new Redis({ url: options.url, token: options.token });
  const perIp = options.perIp ?? { requests: 20, windowSeconds: 60 };
  const dailyCap = options.dailyCap ?? 500;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(perIp.requests, `${perIp.windowSeconds} s`),
    prefix: 'njs:ip',
  });

  return {
    async check(ip) {
      // Per-IP first: a hammering IP must not spend the shared daily budget.
      // Only requests that pass their personal window count against the cap.
      const { success } = await limiter.limit(ip);
      if (!success) return 'ip-limited';

      const day = new Date().toISOString().slice(0, 10);
      const key = `njs:daily:${day}`;
      const used = await redis.incr(key);
      if (used === 1) {
        await redis.expire(key, 60 * 60 * 24 * 2);
      }
      return used > dailyCap ? 'daily-cap-reached' : 'ok';
    },
  };
}
