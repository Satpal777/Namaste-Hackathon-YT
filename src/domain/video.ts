/** A video as listed on a channel page, before any selection decision. */
export interface ChannelVideo {
  readonly videoId: string;
  readonly title: string;
  readonly durationSeconds: number;
  /** As YouTube reports it in the listing, e.g. "5 years ago". */
  readonly publishedText: string;
}
