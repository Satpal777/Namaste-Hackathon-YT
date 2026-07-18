/** A search hit joined back to its Postgres row. If the row is gone, so is the hit. */
export interface HydratedChunk {
  readonly chunkId: string;
  readonly text: string;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly videoTitle: string;
  readonly youtubeVideoId: string;
  readonly score: number;
}

export type HydratedChunkRow = Omit<HydratedChunk, 'score'>;
