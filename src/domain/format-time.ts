/** 872 → "14:32". The format citations, cards, and prompts all speak. */
export function mmss(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
