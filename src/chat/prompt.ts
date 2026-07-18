import { mmss } from '../domain/format-time';
import type { HydratedChunk } from './hydrated-chunk';

/**
 * Numbered excerpts + answer-only-from-context + inline [n] markers. JSON mode
 * is deliberately NOT used: streaming JSON yields malformed frames until the
 * last one, and lets the model hallucinate a source ID. Plain text with [n]
 * markers resolved by the UI cannot cite a source that was never sent.
 */
export function buildSystemPrompt(chunks: readonly HydratedChunk[]): string {
  const excerpts = chunks
    .map(
      (c, i) =>
        `[${i + 1}] (${c.videoTitle}, ${mmss(c.startSeconds)}–${mmss(c.endSeconds)})\n${c.text}`,
    )
    .join('\n\n');

  return `You answer questions using ONLY the numbered transcript excerpts below, taken from the "Namaste JavaScript" YouTube series by Akshay Saini.

Rules:
- Answer only from the excerpts. If they do not contain the answer, say you couldn't find this in the videos — never guess.
- Place inline citation markers like [1] or [2] immediately after the claims they support. Every substantive claim needs a marker. Only use numbers that appear in the excerpts.
- These are spoken-word transcripts: wording may be informal or slightly garbled. Clean up the phrasing, keep the meaning.
- Format with markdown; put code in fenced code blocks.
- Keep answers focused; a few short paragraphs or a list, not an essay.

Excerpts:

${excerpts}`;
}
