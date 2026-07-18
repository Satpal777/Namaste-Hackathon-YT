import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from '../db/client';
import { chunks, videos } from '../db/schema';
import type { HydratedChunkRow } from './hydrated-chunk';

/**
 * The join that makes orphaned vectors unservable. Also re-checks the
 * workspace: even if a foreign chunk ID somehow reached us, the row filter
 * refuses to hydrate it.
 */
export function createChunkHydrator(db: Db, workspaceId: string) {
  return async (chunkIds: readonly string[]): Promise<HydratedChunkRow[]> => {
    if (chunkIds.length === 0) return [];
    return db
      .select({
        chunkId: chunks.id,
        text: chunks.text,
        startSeconds: chunks.startSeconds,
        endSeconds: chunks.endSeconds,
        videoTitle: videos.title,
        youtubeVideoId: videos.youtubeVideoId,
      })
      .from(chunks)
      .innerJoin(videos, eq(chunks.videoId, videos.id))
      .where(and(eq(chunks.workspaceId, workspaceId), inArray(chunks.id, [...chunkIds])));
  };
}
