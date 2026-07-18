import type { ChannelVideo } from '../domain/video';

/**
 * The corpus is the Namaste JavaScript series only — not Namaste React, not
 * vlogs, interviews, or career content. A heterogeneous corpus degrades
 * retrieval; React content would broaden the topic space without deepening it.
 *
 * Resolving the whole channel and then *selecting* is the specced product flow:
 * selection is the thing being demonstrated.
 */
export function selectNamasteJavaScriptSeries(
  videos: readonly ChannelVideo[],
): ChannelVideo[] {
  return videos.filter((v) => {
    const title = normalize(v.title);
    return title.includes('namaste javascript') && !title.includes('react');
  });
}

/**
 * Titles decorate the series name with emoji — "Namaste 🙏 JavaScript Ep. 11"
 * — so matching runs on letters and digits only.
 */
function normalize(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();
}
