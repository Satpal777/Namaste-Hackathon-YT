/**
 * A raw caption unit as YouTube delivers it. Segments are the atoms that chunks
 * are later built from, and a chunk's start/end times are read directly off the
 * segments it spans — never inferred — so a citation lands on the second the
 * claim was spoken.
 *
 * There is no `speaker` field: YouTube ASR captions carry no diarization.
 */
export interface TranscriptSegment {
  /** Seconds from the start of the video. */
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly text: string;
}

export interface Transcript {
  readonly videoId: string;
  readonly videoTitle: string;
  /** The caption track actually returned, which may not be the one requested. */
  readonly languageCode: string;
  readonly segments: readonly TranscriptSegment[];
}
