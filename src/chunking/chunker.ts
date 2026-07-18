import type { Chunk } from '../domain/chunk';
import type { TranscriptSegment } from '../domain/transcript';

export interface ChunkingOptions {
  /** Window budget. Default ~400: small enough that a citation is precise. */
  readonly maxTokens?: number;
  /** Carried into the next window so no thought is cut mid-window. Default ~15%. */
  readonly overlapTokens?: number;
}

/**
 * Pure function: caption segments in, embeddable chunks out.
 *
 * Windows are built from whole segments only, so every chunk boundary is a real
 * caption timing. A segment larger than the whole budget becomes its own chunk —
 * splitting it would fabricate timings.
 */
export function chunkSegments(
  segments: readonly TranscriptSegment[],
  options: ChunkingOptions = {},
): Chunk[] {
  const maxTokens = options.maxTokens ?? 400;
  const overlapTokens = options.overlapTokens ?? Math.round(maxTokens * 0.15);

  const chunks: Chunk[] = [];
  let start = 0;
  while (start < segments.length) {
    let end = start; // exclusive
    let tokenCount = 0;
    while (end < segments.length) {
      const tokens = estimateTokens(segments[end]!.text);
      if (end > start && tokenCount + tokens > maxTokens) break;
      tokenCount += tokens;
      end++;
    }

    const window = segments.slice(start, end);
    chunks.push({
      index: chunks.length,
      text: window.map((s) => s.text).join(' '),
      startSeconds: window[0]!.startSeconds,
      endSeconds: window[window.length - 1]!.endSeconds,
      tokenCount,
    });

    if (end >= segments.length) break;

    // Walk back from the window's end to re-include ~overlapTokens of trailing
    // segments, always leaving at least one newly-consumed segment behind so
    // the window advances.
    let next = end;
    let overlap = 0;
    while (next > start + 1) {
      const tokens = estimateTokens(segments[next - 1]!.text);
      if (overlap + tokens > overlapTokens) break;
      overlap += tokens;
      next--;
    }
    start = next;
  }

  return chunks;
}

/**
 * ~4 characters per token, the standard heuristic for English text. Chunking
 * only needs windows of roughly even size; exact tokenization would add a
 * dependency to change nothing a user can observe.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
