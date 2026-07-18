import { describe, expect, it } from 'vitest';
import type { TranscriptSegment } from '../domain/transcript';
import { chunkSegments, estimateTokens } from './chunker';

/** Build a segment lasting `seconds` whose text is roughly `tokens` tokens. */
function segment(
  startSeconds: number,
  seconds: number,
  tokens: number,
  label = 'w',
): TranscriptSegment {
  // estimateTokens is ~chars/4, so 4 chars ≈ 1 token. Words of 7 chars + space
  // give 2 tokens per word.
  const words = Math.max(1, Math.round(tokens / 2));
  return {
    startSeconds,
    endSeconds: startSeconds + seconds,
    text: Array.from({ length: words }, (_, i) => `${label}${String(i).padStart(5, '0')}x`).join(' '),
  };
}

/** A run of contiguous segments, each ~20 tokens over 5 seconds. */
function run(count: number, tokensEach = 20): TranscriptSegment[] {
  return Array.from({ length: count }, (_, i) =>
    segment(i * 5, 5, tokensEach, `s${i}-`),
  );
}

describe('chunkSegments', () => {
  it('returns no chunks for no segments', () => {
    expect(chunkSegments([])).toEqual([]);
  });

  it('puts a video shorter than one window into a single chunk spanning it exactly', () => {
    const segments = run(5); // ~100 tokens, well under the 400 window
    const chunks = chunkSegments(segments);

    expect(chunks).toHaveLength(1);
    const chunk = chunks[0]!;
    expect(chunk.startSeconds).toBe(segments[0]!.startSeconds);
    expect(chunk.endSeconds).toBe(segments[4]!.endSeconds);
    expect(chunk.text).toBe(segments.map((s) => s.text).join(' '));
  });

  it('splits a long transcript into windows of at most the token budget', () => {
    const segments = run(60); // ~1200 tokens
    const chunks = chunkSegments(segments);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(400);
    }
  });

  it('reads every chunk boundary directly off a constituent segment', () => {
    const segments = run(60);
    const starts = new Set(segments.map((s) => s.startSeconds));
    const ends = new Set(segments.map((s) => s.endSeconds));

    for (const chunk of chunkSegments(segments)) {
      expect(starts).toContain(chunk.startSeconds);
      expect(ends).toContain(chunk.endSeconds);
      expect(chunk.endSeconds).toBeGreaterThan(chunk.startSeconds);
    }
  });

  it('overlaps consecutive chunks by re-including trailing segments', () => {
    const segments = run(60);
    const chunks = chunkSegments(segments);

    for (let i = 1; i < chunks.length; i++) {
      // The next window starts before the previous one ended: shared segments.
      expect(chunks[i]!.startSeconds).toBeLessThan(chunks[i - 1]!.endSeconds);
      // But it must always advance, or chunking would loop forever.
      expect(chunks[i]!.startSeconds).toBeGreaterThan(chunks[i - 1]!.startSeconds);
    }
  });

  it('covers every segment: no spoken text is lost between windows', () => {
    const segments = run(60);
    const chunks = chunkSegments(segments);

    for (const seg of segments) {
      expect(
        chunks.some(
          (c) => c.startSeconds <= seg.startSeconds && c.endSeconds >= seg.endSeconds,
        ),
      ).toBe(true);
    }
  });

  it('emits the trailing partial window as a final chunk ending on the last segment', () => {
    // 23 segments × ~20 tokens ≈ 460: one full window plus a small remainder.
    const segments = run(23);
    const chunks = chunkSegments(segments);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[chunks.length - 1]!.endSeconds).toBe(segments[22]!.endSeconds);
  });

  it('gives an oversized single segment its own chunk rather than stalling', () => {
    const segments = [
      segment(0, 5, 20, 'a'),
      segment(5, 60, 900, 'big'), // alone exceeds the whole window
      segment(65, 5, 20, 'b'),
    ];
    const chunks = chunkSegments(segments);

    expect(chunks.some((c) => c.startSeconds === 5 && c.endSeconds === 65)).toBe(true);
    expect(chunks[chunks.length - 1]!.endSeconds).toBe(70);
  });

  it('numbers chunks consecutively from zero', () => {
    const chunks = chunkSegments(run(60));
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
  });
});

describe('estimateTokens', () => {
  it('scales with text length rather than returning a constant', () => {
    const short = estimateTokens('hello world');
    const long = estimateTokens('hello world '.repeat(100));
    expect(long).toBeGreaterThan(short * 50);
  });
});
