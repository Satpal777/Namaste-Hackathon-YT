/**
 * Survives provider quota exhaustion instead of crashing a long run.
 *
 * Gemini's free tier caps embed_content at 100 requests/minute and counts
 * every item in a batch, so bulk seeding trips 429 RESOURCE_EXHAUSTED by
 * construction. The response carries the fix in its own message ("Please
 * retry in 8.08s") — wait that long and continue, rather than dying halfway
 * through a seed and burning the quota again on the rerun.
 */

const DEFAULT_WAIT_SECONDS = 30;
/** Waits beyond this mean a daily cap, not a minute window — give up loudly. */
const DEFAULT_MAX_WAIT_SECONDS = 900;
const DEFAULT_MAX_ATTEMPTS = 30;
/** Slack on top of the server's hint so we don't knock a moment too early. */
const WAIT_SLACK_MS = 500;

export interface QuotaRetryOptions {
  /** Give up if the server asks us to wait longer than this (default 900s). */
  readonly maxWaitSeconds?: number;
  readonly maxAttempts?: number;
  readonly onWait?: (seconds: number, attempt: number) => void;
  /** Injectable for tests. */
  readonly sleep?: (ms: number) => Promise<void>;
}

export async function withQuotaRetry<T>(
  fn: () => Promise<T>,
  options: QuotaRetryOptions = {},
): Promise<T> {
  const maxWaitSeconds = options.maxWaitSeconds ?? DEFAULT_MAX_WAIT_SECONDS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isQuotaExhausted(error) || attempt >= maxAttempts) throw error;
      const waitSeconds = suggestedRetrySeconds(error) ?? DEFAULT_WAIT_SECONDS;
      if (waitSeconds > maxWaitSeconds) {
        // A multi-hour hint is a daily cap; waiting silently would hang the
        // run past any deadline. Surface the number and stop.
        throw error;
      }
      options.onWait?.(waitSeconds, attempt);
      await sleep(Math.ceil(waitSeconds * 1000) + WAIT_SLACK_MS);
    }
  }
}

/** True for 429 / RESOURCE_EXHAUSTED anywhere in the error chain. */
export function isQuotaExhausted(error: unknown): boolean {
  return chain(error).some(
    (e) =>
      e.statusCode === 429 ||
      /RESOURCE_EXHAUSTED|exceeded your current quota|quota exceeded/i.test(
        e.message,
      ),
  );
}

/** The wait the server itself suggested ("Please retry in 8.08s"), if any. */
export function suggestedRetrySeconds(error: unknown): number | undefined {
  for (const e of chain(error)) {
    const match = e.message.match(/retry in ([\d.]+)\s*s/i);
    if (match) return Number(match[1]);
  }
  return undefined;
}

interface ErrorLike {
  readonly message: string;
  readonly statusCode?: number;
}

/**
 * The AI SDK wraps provider failures (RetryError.lastError, Error.cause,
 * AggregateError.errors) — walk the whole chain so detection doesn't depend
 * on which layer threw.
 */
function chain(error: unknown): ErrorLike[] {
  const seen = new Set<unknown>();
  const out: ErrorLike[] = [];
  const visit = (e: unknown): void => {
    if (!e || typeof e !== 'object' || seen.has(e)) return;
    seen.add(e);
    const record = e as {
      message?: unknown;
      statusCode?: unknown;
      cause?: unknown;
      lastError?: unknown;
      errors?: unknown;
    };
    if (typeof record.message === 'string') {
      out.push({
        message: record.message,
        statusCode:
          typeof record.statusCode === 'number' ? record.statusCode : undefined,
      });
    }
    visit(record.cause);
    visit(record.lastError);
    if (Array.isArray(record.errors)) record.errors.forEach(visit);
  };
  visit(error);
  return out;
}
