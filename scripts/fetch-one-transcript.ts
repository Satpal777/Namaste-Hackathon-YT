/**
 * Ticket #1 spike: prove transcript acquisition works before building on it.
 * Run locally (residential IP only): pnpm transcript:spike [videoId]
 */
import { InnertubeTranscriptProvider } from '../src/transcripts/innertube-transcript-provider';
import type { TranscriptProvider } from '../src/transcripts/transcript-provider';

const videoId = process.argv[2] ?? 'ZvbzSrg0afE'; // Namaste JavaScript Ep.1

const provider: TranscriptProvider = new InnertubeTranscriptProvider();
const transcript = await provider.fetchTranscript(videoId);

console.log(`video:    ${transcript.videoTitle}`);
console.log(`language: ${transcript.languageCode}`);
console.log(`segments: ${transcript.segments.length}`);
console.log('');

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const { segments } = transcript;
const shown =
  segments.length <= 12
    ? segments
    : [...segments.slice(0, 6), undefined, ...segments.slice(-6)];
for (const seg of shown) {
  if (!seg) {
    console.log(`  … ${segments.length - 12} more …`);
    continue;
  }
  console.log(`  [${mmss(seg.startSeconds)}–${mmss(seg.endSeconds)}] ${seg.text}`);
}
