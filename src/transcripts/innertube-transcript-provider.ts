import { Innertube } from 'youtubei.js';
import type { Transcript, TranscriptSegment } from '../domain/transcript';
import {
  TranscriptUnavailableError,
  type TranscriptProvider,
} from './transcript-provider';

/**
 * Fetches captions via the InnerTube IOS client's player response. Two other
 * routes are dead as of July 2026, which is why this one exists:
 *
 * - The WEB client's `timedtext` URLs return an empty 200 without a
 *   proof-of-origin token.
 * - The `/get_transcript` endpoint rejects youtubei.js's requests with a 400.
 *
 * The IOS client's caption URLs still serve `fmt=json3` from residential IPs.
 * This runs ONLY on a developer's machine — see TranscriptProvider.
 */
export class InnertubeTranscriptProvider implements TranscriptProvider {
  #innertube: Promise<Innertube> | undefined;

  #session(): Promise<Innertube> {
    this.#innertube ??= Innertube.create({ retrieve_player: false });
    return this.#innertube;
  }

  async fetchTranscript(videoId: string): Promise<Transcript> {
    const yt = await this.#session();

    const info = await yt.getBasicInfo(videoId, { client: 'IOS' }).catch((cause) => {
      throw new TranscriptUnavailableError(videoId, 'could not load video info', {
        cause,
      });
    });

    const videoTitle = info.basic_info.title ?? videoId;
    const tracks: CaptionTrack[] = info.captions?.caption_tracks ?? [];
    const track = pickEnglishTrack(tracks);
    if (!track) {
      const available = tracks.map((t) => t.language_code).join(', ') || 'none';
      throw new TranscriptUnavailableError(
        videoId,
        `no English caption track (available: ${available})`,
      );
    }

    const url = `${track.base_url}&fmt=json3`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new TranscriptUnavailableError(
        videoId,
        `caption fetch returned HTTP ${response.status}`,
      );
    }
    const body = await response.text();
    if (body.length === 0) {
      // YouTube's empty-200 means the request was refused (datacenter IP or
      // missing proof-of-origin token), not that the video has no captions.
      throw new TranscriptUnavailableError(
        videoId,
        'caption endpoint returned an empty body — likely blocked from this IP',
      );
    }

    const segments = parseJson3(body);
    if (segments.length === 0) {
      throw new TranscriptUnavailableError(videoId, 'caption track has no text');
    }

    return {
      videoId,
      videoTitle,
      languageCode: track.language_code,
      segments,
    };
  }
}

interface CaptionTrack {
  readonly base_url: string;
  readonly language_code: string;
  /** 'asr' for auto-generated tracks; absent for manually-uploaded ones. */
  readonly kind?: string;
}

/**
 * Manual English captions beat ASR: they carry punctuation and full sentences,
 * which embed better and read better in citations. Never falls back to a
 * non-English track — a silent language switch would poison the corpus.
 */
function pickEnglishTrack(tracks: readonly CaptionTrack[]): CaptionTrack | undefined {
  const english = tracks.filter((t) => t.language_code.startsWith('en'));
  return english.find((t) => t.kind !== 'asr') ?? english[0];
}

interface Json3Event {
  readonly tStartMs: number;
  readonly dDurationMs?: number;
  readonly segs?: readonly { readonly utf8: string }[];
}

function parseJson3(body: string): TranscriptSegment[] {
  const events: Json3Event[] = JSON.parse(body).events ?? [];
  const segments: TranscriptSegment[] = [];
  for (const event of events) {
    if (!event.segs) continue;
    const text = event.segs
      .map((s) => s.utf8)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length === 0) continue; // ASR tracks emit newline-only spacer events
    segments.push({
      startSeconds: event.tStartMs / 1000,
      endSeconds: (event.tStartMs + (event.dDurationMs ?? 0)) / 1000,
      text,
    });
  }
  return segments;
}
