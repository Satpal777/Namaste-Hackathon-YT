import type { Transcript } from '../domain/transcript';

/**
 * Isolates transcript acquisition — the single highest-risk dependency in the
 * product. Every caller goes through this interface so the implementation can be
 * replaced when YouTube changes, and so tests can fake it.
 *
 * Implementations that scrape run ONLY on a developer's machine. YouTube blocks
 * the caption endpoint from datacenter IP ranges, so a scraper in the deployed
 * app works in dev and silently returns nothing in prod. The demo serves
 * pre-fetched, cached transcripts and never calls this at request time.
 */
export interface TranscriptProvider {
  fetchTranscript(videoId: string): Promise<Transcript>;
}

/**
 * Thrown when a transcript cannot be acquired. Callers must not treat a missing
 * transcript as an empty one — an empty corpus entry would silently degrade
 * retrieval rather than fail.
 */
export class TranscriptUnavailableError extends Error {
  constructor(
    readonly videoId: string,
    reason: string,
    options?: { cause?: unknown },
  ) {
    super(`No transcript for video ${videoId}: ${reason}`, options);
    this.name = 'TranscriptUnavailableError';
  }
}
