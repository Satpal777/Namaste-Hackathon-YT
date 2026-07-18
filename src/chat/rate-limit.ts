/**
 * Two distinct controls, both required. Per-IP sliding windows SHAPE organic
 * traffic; the global daily cap BOUNDS liability — abusers rotate IPs, so only
 * the cap limits the worst case. On cap exhaustion the demo politely closes
 * for the day instead of billing.
 */
export type RateLimitDecision = 'ok' | 'ip-limited' | 'daily-cap-reached';

export interface RateLimiter {
  check(ip: string): Promise<RateLimitDecision>;
}

/** Local dev and tests run unlimited; the deployed demo must configure Upstash. */
export const unlimited: RateLimiter = {
  check: async () => 'ok',
};
