import type { UIMessage } from 'ai';

/**
 * The wire contract between the chat endpoint and the UI. Sources are known at
 * retrieval time — the model does not discover them — so they are sent as a
 * data part BEFORE the first token, and the UI resolves the model's inline
 * `[n]` markers against this list.
 */
export interface ChatSource {
  /** The number the model cites: excerpt [n] in its prompt. */
  readonly n: number;
  readonly videoTitle: string;
  readonly youtubeVideoId: string;
  readonly startSeconds: number;
  readonly endSeconds: number;
  /** YouTube deep link that lands on the second the claim was spoken. */
  readonly url: string;
}

export type NamasteUIMessage = UIMessage<never, { sources: ChatSource[] }>;

/**
 * Abstention is the trust mechanism — no confidence number is shown anywhere.
 * Below the retrieval-score threshold the system says this instead of
 * synthesising an answer from irrelevant context.
 */
export const ABSTENTION_MESSAGE =
  "I couldn't find this in the uploaded videos. Try asking about a JavaScript concept the Namaste JavaScript series covers — hoisting, closures, the event loop, promises.";

/**
 * Shown when the hard global daily budget cap is exhausted. A cost cap, not a
 * bug — and it must read that way.
 */
export const DAILY_LIMIT_MESSAGE =
  "The demo has reached its daily usage limit — it caps spend so a traffic spike can't run up a bill. It resets at midnight UTC; please come back then.";

export function youtubeDeepLink(youtubeVideoId: string, startSeconds: number): string {
  return `https://www.youtube.com/watch?v=${youtubeVideoId}&t=${Math.floor(startSeconds)}s`;
}
