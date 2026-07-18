/**
 * Turns the model's inline `[n]` markers into markdown links (`#source-n`)
 * that the renderer swaps for citation chips. Only numbers that match a real
 * source become links — the model cannot cite what was never sent — and code
 * spans are left alone, or `arr[1]` would sprout a citation.
 */
export function linkifyCitations(markdown: string, sourceCount: number): string {
  // Odd indexes after this split are code spans (fenced or inline).
  const parts = markdown.split(/(```[\s\S]*?```|`[^`]*`)/);
  const transformed = parts.map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(/\[(\d+)\]/g, (match, n: string) => {
      const num = Number(n);
      return num >= 1 && num <= sourceCount ? `[${n}](#source-${n})` : match;
    });
  });

  // A streaming response may end mid-code-block; the unterminated tail after
  // the last fence is code, so undo any transformation there.
  const joined = transformed.join('');
  const fences = (joined.match(/```/g) ?? []).length;
  if (fences % 2 === 1) {
    const lastFence = joined.lastIndexOf('```');
    return (
      joined.slice(0, lastFence) +
      joined.slice(lastFence).replace(/\[(\d+)\]\(#source-\1\)/g, '[$1]')
    );
  }
  return joined;
}
