/**
 * Cached corpus → Neon + both Qdrant collections. Run locally:
 *
 *   pnpm seed
 *
 * Reads corpus/ (produced by `pnpm seed:corpus` — this script never touches
 * YouTube), chunks every transcript, writes channel/video/transcript/chunk
 * rows to Postgres, then embeds and upserts into BOTH provider collections so
 * switching providers later points at an already-populated collection.
 *
 * Idempotent by construction: every row and point ID is a deterministic UUID
 * of its natural key, so re-running upserts instead of duplicating.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { chunkSegments } from '../src/chunking/chunker';
import { createDb } from '../src/db/client';
import { deterministicUuid } from '../src/db/deterministic-uuid';
import * as schema from '../src/db/schema';
import { DEMO_WORKSPACE_ID } from '../src/db/workspace';
import type { Transcript } from '../src/domain/transcript';
import {
  API_KEY_ENV_VAR,
  createEmbeddingProvider,
  type EmbeddingProviderName,
} from '../src/embeddings/providers';
import { collectionNameFor } from '../src/vectors/collection-name';
import { QdrantVectorStore } from '../src/vectors/qdrant-vector-store';
import type { VectorPoint } from '../src/vectors/vector-store';

const CORPUS_DIR = path.join(import.meta.dirname, '..', 'corpus');

interface Manifest {
  channel: { channelId: string; title: string; handle: string };
  videos: {
    videoId: string;
    title: string;
    durationSeconds: number;
    publishedText: string;
    error?: string;
  }[];
}

const databaseUrl = process.env.DATABASE_URL;
const qdrantUrl = process.env.QDRANT_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for seeding');
if (!qdrantUrl) throw new Error('QDRANT_URL is required for seeding');

const manifest: Manifest = JSON.parse(
  await readFile(path.join(CORPUS_DIR, 'manifest.json'), 'utf8'),
);
const transcriptFiles = (await readdir(path.join(CORPUS_DIR, 'transcripts'))).filter((f) =>
  f.endsWith('.json'),
);

const db = createDb(databaseUrl);
const ws = DEMO_WORKSPACE_ID;

// --- Postgres: workspace, channel, videos, transcripts, chunks ---

await db
  .insert(schema.workspaces)
  .values({ id: ws, name: 'Namaste JavaScript demo' })
  .onConflictDoNothing();

const channelRowId = deterministicUuid(`${ws}:channel:${manifest.channel.channelId}`);
await db
  .insert(schema.channels)
  .values({
    id: channelRowId,
    workspaceId: ws,
    youtubeChannelId: manifest.channel.channelId,
    handle: manifest.channel.handle,
    title: manifest.channel.title,
  })
  .onConflictDoUpdate({
    target: [schema.channels.workspaceId, schema.channels.youtubeChannelId],
    set: { handle: manifest.channel.handle, title: manifest.channel.title },
  });

interface SeededChunk {
  readonly id: string;
  readonly text: string;
  readonly videoRowId: string;
}

const allChunks: SeededChunk[] = [];

for (const file of transcriptFiles) {
  const transcript: Transcript = JSON.parse(
    await readFile(path.join(CORPUS_DIR, 'transcripts', file), 'utf8'),
  );
  const meta = manifest.videos.find((v) => v.videoId === transcript.videoId);
  const videoRowId = deterministicUuid(`${ws}:video:${transcript.videoId}`);

  await db
    .insert(schema.videos)
    .values({
      id: videoRowId,
      workspaceId: ws,
      channelId: channelRowId,
      youtubeVideoId: transcript.videoId,
      title: transcript.videoTitle,
      durationSeconds: meta?.durationSeconds ?? 0,
      publishedText: meta?.publishedText ?? '',
    })
    .onConflictDoUpdate({
      target: [schema.videos.workspaceId, schema.videos.youtubeVideoId],
      set: { title: transcript.videoTitle },
    });

  await db
    .insert(schema.transcripts)
    .values({
      id: deterministicUuid(`${ws}:transcript:${transcript.videoId}`),
      workspaceId: ws,
      videoId: videoRowId,
      languageCode: transcript.languageCode,
      segments: transcript.segments,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.transcripts.videoId],
      set: { languageCode: transcript.languageCode, segments: transcript.segments },
    });

  const chunks = chunkSegments(transcript.segments);
  const rows = chunks.map((c) => ({
    id: deterministicUuid(`${ws}:chunk:${transcript.videoId}:${c.index}`),
    workspaceId: ws,
    videoId: videoRowId,
    chunkIndex: c.index,
    text: c.text,
    startSeconds: c.startSeconds,
    endSeconds: c.endSeconds,
    tokenCount: c.tokenCount,
  }));
  for (const row of rows) {
    await db
      .insert(schema.chunks)
      .values(row)
      .onConflictDoUpdate({
        target: [schema.chunks.id],
        set: {
          text: row.text,
          startSeconds: row.startSeconds,
          endSeconds: row.endSeconds,
          tokenCount: row.tokenCount,
        },
      });
  }
  allChunks.push(...rows.map((r) => ({ id: r.id, text: r.text, videoRowId })));
  console.log(`postgres ${transcript.videoId}  chunks=${rows.length}  ${transcript.videoTitle.slice(0, 60)}`);
}

console.log(`\nTotal chunks: ${allChunks.length}`);

// --- Qdrant: both collections, so the provider switch never reindexes ---

const providers: EmbeddingProviderName[] = ['gemini', 'openai'];
for (const name of providers) {
  const keyVar = API_KEY_ENV_VAR[name];
  if (!process.env[keyVar]) {
    console.warn(`skipping ${name}: ${keyVar} not set`);
    continue;
  }
  const embedding = createEmbeddingProvider(name);
  const store = new QdrantVectorStore({
    url: qdrantUrl,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: collectionNameFor(embedding),
    dimensions: embedding.dimensions,
  });
  await store.ensureCollection();

  const BATCH = 100;
  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);
    const vectors = await embedding.embedDocuments(batch.map((c) => c.text));
    const points: VectorPoint[] = batch.map((c, j) => ({
      id: c.id,
      vector: vectors[j]!,
      payload: { workspaceId: ws, videoId: c.videoRowId, chunkId: c.id },
    }));
    await store.upsert(points);
    console.log(`${store.collectionName}  ${Math.min(i + BATCH, allChunks.length)}/${allChunks.length}`);
  }
}

console.log('\nSeed complete.');
