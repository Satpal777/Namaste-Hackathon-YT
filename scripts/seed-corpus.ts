/**
 * Ticket #4: channel handle → cached, committed corpus. Run locally only:
 *
 *   pnpm seed:corpus
 *
 * Resolves the channel, lists every video, selects the Namaste JavaScript
 * series, fetches those transcripts, and caches them verbatim in corpus/ so the
 * deployed demo never touches YouTube. Already-cached transcripts are skipped,
 * so a failed run can be resumed.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { listChannelVideos } from '../src/ingestion/channel-catalog';
import { selectNamasteJavaScriptSeries } from '../src/ingestion/select-series';
import { InnertubeTranscriptProvider } from '../src/transcripts/innertube-transcript-provider';
import type { TranscriptProvider } from '../src/transcripts/transcript-provider';
import { TranscriptUnavailableError } from '../src/transcripts/transcript-provider';

const HANDLE = '@akshaymarch7';
const CORPUS_DIR = path.join(import.meta.dirname, '..', 'corpus');
const TRANSCRIPTS_DIR = path.join(CORPUS_DIR, 'transcripts');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

console.log(`Resolving ${HANDLE}…`);
const channel = await listChannelVideos(HANDLE);
console.log(`Channel: ${channel.title} (${channel.channelId})`);
console.log(`Videos on channel: ${channel.videos.length}`);

const selected = selectNamasteJavaScriptSeries(channel.videos);
console.log(`Selected (Namaste JavaScript series): ${selected.length}`);
for (const v of selected) {
  const mm = Math.floor(v.durationSeconds / 60);
  console.log(`  ${v.videoId}  ${String(mm).padStart(3)}min  ${v.title}`);
}

await mkdir(TRANSCRIPTS_DIR, { recursive: true });

const provider: TranscriptProvider = new InnertubeTranscriptProvider();
const results: {
  videoId: string;
  title: string;
  durationSeconds: number;
  publishedText: string;
  languageCode?: string;
  segmentCount?: number;
  error?: string;
}[] = [];

for (const video of selected) {
  const file = path.join(TRANSCRIPTS_DIR, `${video.videoId}.json`);
  if (existsSync(file)) {
    const cached = JSON.parse(await readFile(file, 'utf8'));
    results.push({
      ...video,
      languageCode: cached.languageCode,
      segmentCount: cached.segments.length,
    });
    console.log(`cached  ${video.videoId}  ${video.title}`);
    continue;
  }
  try {
    const transcript = await provider.fetchTranscript(video.videoId);
    await writeFile(file, `${JSON.stringify(transcript, null, 2)}\n`, 'utf8');
    results.push({
      ...video,
      languageCode: transcript.languageCode,
      segmentCount: transcript.segments.length,
    });
    console.log(
      `fetched ${video.videoId}  lang=${transcript.languageCode} segments=${transcript.segments.length}  ${video.title}`,
    );
  } catch (err) {
    const reason = err instanceof TranscriptUnavailableError ? err.message : String(err);
    results.push({ ...video, error: reason });
    console.error(`FAILED  ${video.videoId}  ${reason}`);
  }
  // Gentle pacing: a burst of caption fetches earns the IP a temporary 429
  // from the timedtext endpoint, which then blocks the whole run.
  await sleep(2500 + Math.random() * 1500);
}

const manifest = {
  fetchedAt: new Date().toISOString(),
  channel: { channelId: channel.channelId, title: channel.title, handle: channel.handle },
  videos: results,
};
await writeFile(
  path.join(CORPUS_DIR, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

const failed = results.filter((r) => r.error);
console.log('');
console.log(`Done: ${results.length - failed.length}/${results.length} transcripts cached.`);
if (failed.length > 0) {
  console.log('Failures:');
  for (const f of failed) console.log(`  ${f.videoId}  ${f.title}: ${f.error}`);
  process.exitCode = 1;
}
