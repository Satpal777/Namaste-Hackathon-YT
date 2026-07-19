import {
  boolean,
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

/**
 * Interview Prep lives on a different ownership axis than the corpus. The video
 * corpus above is scoped by `workspaceId` (whose videos these are); a quiz is
 * scoped by `userId` (the Clerk user, or an anon-cookie id when Clerk is not
 * configured) — because the corpus is shared but progress is personal. So these
 * two tables carry `userId`, never `workspaceId`.
 */
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    total: integer('total').notNull(),
    /** Number correct; null until the attempt is submitted. */
    score: integer('score'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
  },
  (t) => [index('quiz_attempts_user').on(t.userId)],
);

/**
 * One row per generated MCQ. It carries both the question (persisted at
 * generation, so the answer key never travels to the browser) and the user's
 * response (filled in at submit). Mastery is a `GROUP BY topic` over the
 * answered rows — no materialised mastery table.
 */
export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => quizAttempts.id),
    /** Denormalised from the attempt so mastery aggregates need no join. */
    userId: text('user_id').notNull(),
    position: integer('position').notNull(),
    topic: text('topic').notNull(),
    difficulty: text('difficulty', { enum: ['foundational', 'hard'] }).notNull(),
    /** True when written from retrieved transcript excerpts (cites a second). */
    grounded: boolean('grounded').notNull(),
    stem: text('stem').notNull(),
    options: jsonb('options').$type<string[]>().notNull(),
    correctIndex: integer('correct_index').notNull(),
    explanation: text('explanation').notNull(),
    /** Grounded source; all null for an open (non-sourced) question. */
    sourceVideoId: text('source_video_id'),
    sourceVideoTitle: text('source_video_title'),
    sourceStartSeconds: real('source_start_seconds'),
    sourceEndSeconds: real('source_end_seconds'),
    /** The user's response; null until the attempt is submitted. */
    chosenIndex: integer('chosen_index'),
    correct: boolean('correct'),
  },
  (t) => [
    index('quiz_questions_attempt').on(t.attemptId),
    index('quiz_questions_user_topic').on(t.userId, t.topic),
  ],
);
