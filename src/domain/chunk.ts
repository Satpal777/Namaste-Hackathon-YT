/**
 * The embedded unit: a window of consecutive transcript segments. Chunk size is
 * dictated by citation granularity, not model limits — "jump to 14:32" must be
 * precise, so windows stay small (~400 tokens).
 *
 * `startSeconds`/`endSeconds` are copied from the first and last constituent
 * segment — exact, never inferred — so a timestamp deep link lands on the
 * second the claim was spoken.
 */
export interface Chunk {
  /** Position within the video's chunk sequence; stable input for chunk IDs. */
  readonly index: number;
  readonly text: string;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly tokenCount: number;
}
