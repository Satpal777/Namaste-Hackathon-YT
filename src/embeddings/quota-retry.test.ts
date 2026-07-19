import { describe, expect, it } from 'vitest';
import {
  isQuotaExhausted,
  suggestedRetrySeconds,
  withQuotaRetry,
} from './quota-retry';

/** The exact shape Gemini's free tier returned during seeding. */
const GEMINI_QUOTA_MESSAGE =
  'You exceeded your current quota, please check your plan and billing details. ' +
  'For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. ' +
  '* Quota exceeded for metric: generativelanguage.googleapis.com/embed_content_free_tier_requests, ' +
  'limit: 100, model: gemini-embedding-2\nPlease retry in 8.089535733s.';

function quotaError(): Error {
  return new Error(GEMINI_QUOTA_MESSAGE);
}

describe('isQuotaExhausted', () => {
  it('recognises the Gemini RESOURCE_EXHAUSTED message', () => {
    expect(isQuotaExhausted(quotaError())).toBe(true);
  });

  it('recognises a 429 status code on the error object', () => {
    const error = Object.assign(new Error('rate limited'), { statusCode: 429 });
    expect(isQuotaExhausted(error)).toBe(true);
  });

  it('finds the quota error when the AI SDK wraps it (cause / lastError)', () => {
    const wrapped = Object.assign(new Error('Failed after 3 attempts'), {
      lastError: quotaError(),
    });
    expect(isQuotaExhausted(wrapped)).toBe(true);
    expect(isQuotaExhausted(new Error('outer', { cause: quotaError() }))).toBe(
      true,
    );
  });

  it('rejects unrelated errors', () => {
    expect(isQuotaExhausted(new Error('ECONNREFUSED'))).toBe(false);
    expect(isQuotaExhausted(undefined)).toBe(false);
  });
});

describe('suggestedRetrySeconds', () => {
  it("parses the server's retry hint", () => {
    expect(suggestedRetrySeconds(quotaError())).toBeCloseTo(8.089535733);
  });

  it('parses the hint out of a wrapping error', () => {
    const wrapped = new Error('outer', { cause: quotaError() });
    expect(suggestedRetrySeconds(wrapped)).toBeCloseTo(8.089535733);
  });

  it('returns undefined when there is no hint', () => {
    expect(suggestedRetrySeconds(new Error('quota exceeded'))).toBeUndefined();
  });
});

describe('withQuotaRetry', () => {
  it('retries quota errors until the call succeeds, honouring the hint', async () => {
    const waits: number[] = [];
    let calls = 0;
    const result = await withQuotaRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw quotaError();
        return 'ok';
      },
      { sleep: async (ms) => void waits.push(ms) },
    );
    expect(result).toBe('ok');
    expect(calls).toBe(3);
    expect(waits).toHaveLength(2);
    // Hint of ~8.09s plus a little slack, never less than the hint itself.
    expect(waits[0]!).toBeGreaterThanOrEqual(8_089);
    expect(waits[0]!).toBeLessThan(15_000);
  });

  it('rethrows non-quota errors immediately', async () => {
    let calls = 0;
    await expect(
      withQuotaRetry(
        async () => {
          calls += 1;
          throw new Error('ECONNREFUSED');
        },
        { sleep: async () => {} },
      ),
    ).rejects.toThrow('ECONNREFUSED');
    expect(calls).toBe(1);
  });

  it('gives up when the server asks for a longer wait than allowed', async () => {
    await expect(
      withQuotaRetry(
        async () => {
          throw new Error('quota exceeded. Please retry in 7200s.');
        },
        { maxWaitSeconds: 900, sleep: async () => {} },
      ),
    ).rejects.toThrow(/7200/);
  });

  it('falls back to a default wait when the error has no hint', async () => {
    const waits: number[] = [];
    let calls = 0;
    await withQuotaRetry(
      async () => {
        calls += 1;
        if (calls === 1) throw new Error('RESOURCE_EXHAUSTED');
        return 'ok';
      },
      { sleep: async (ms) => void waits.push(ms) },
    );
    expect(waits).toEqual([30_500]);
  });
});
