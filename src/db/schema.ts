import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Stage 1 metadata store: seven tables, `workspaceId` on every one. Postgres is
 * the source of truth; Qdrant is only an index over `chunks` — a chunk that has
 * no row here must never be served, whatever the vector store returns.
 *
 * Rows use deterministic UUIDs derived from their natural keys (see
 * `deterministicUuid`), so re-running the seed upserts instead of duplicating,
 * and a chunk's Postgres ID doubles as its Qdrant point ID.
 */

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const channels = pgTable(
  'channels',
  {
    id: uuid('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    youtubeChannelId: text('youtube_channel_id').notNull(),
    handle: text('handle').notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('channels_workspace_youtube').on(t.workspaceId, t.youtubeChannelId)],
);

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id),
    youtubeVideoId: text('youtube_video_id').notNull(),
    title: text('title').notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    publishedText: text('published_text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('videos_workspace_youtube').on(t.workspaceId, t.youtubeVideoId)],
);

export const transcripts = pgTable(
  'transcripts',
  {
    id: uuid('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id),
    languageCode: text('language_code').notNull(),
    /** Raw caption segments, verbatim as fetched: re-chunkable without re-fetching. */
    segments: jsonb('segments').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex('transcripts_video').on(t.videoId)],
);

export const chunks = pgTable(
  'chunks',
  {
    /** Also the Qdrant point ID — hydration is a lookup by this ID. */
    id: uuid('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id),
    chunkIndex: integer('chunk_index').notNull(),
    text: text('text').notNull(),
    startSeconds: real('start_seconds').notNull(),
    endSeconds: real('end_seconds').notNull(),
    tokenCount: integer('token_count').notNull(),
  },
  (t) => [
    uniqueIndex('chunks_video_index').on(t.videoId, t.chunkIndex),
    index('chunks_workspace').on(t.workspaceId),
  ],
);

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    /** The citation list sent with an assistant turn, if any. */
    sources: jsonb('sources'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_chat').on(t.chatId)],
);
