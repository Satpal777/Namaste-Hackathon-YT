import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type LanguageModel,
  type UIMessage,
  type UIMessageStreamWriter,
} from 'ai';
import type { EmbeddingProvider } from '../embeddings/embedding-provider';
import type { VectorStore } from '../vectors/vector-store';
import {
  ABSTENTION_MESSAGE,
  DAILY_LIMIT_MESSAGE,
  youtubeDeepLink,
  type ChatSource,
  type NamasteUIMessage,
} from './contract';
import type { HydratedChunk, HydratedChunkRow } from './hydrated-chunk';
import { buildSystemPrompt } from './prompt';
import { unlimited, type RateLimiter } from './rate-limit';

export interface ChatHandlerDeps {
  readonly embedding: EmbeddingProvider;
  readonly vectorStore: VectorStore;
  /** Joins chunk IDs back to Postgres. IDs with no row simply don't return. */
  readonly hydrateChunks: (
    chunkIds: readonly string[],
  ) => Promise<readonly HydratedChunkRow[]>;
  readonly chatModel: LanguageModel;
  readonly workspaceId: string;
  /** Below this top-hit score the system abstains instead of answering. */
  readonly abstentionThreshold: number;
  readonly topK?: number;
  readonly rateLimiter?: RateLimiter;
}

/**
 * The product's only real entry point, built as a plain Request → Response
 * function so tests exercise retrieval, tenancy, hydration, thresholding,
 * prompt construction, and streaming through the same seam the browser uses.
 */
export function createChatHandler(deps: ChatHandlerDeps) {
  return async function handleChat(request: Request): Promise<Response> {
    const decision = await (deps.rateLimiter ?? unlimited).check(clientIp(request));
    if (decision === 'ip-limited') {
      return Response.json(
        { error: 'Too many requests — please slow down a little.' },
        { status: 429 },
      );
    }
    if (decision === 'daily-cap-reached') {
      return fixedMessageResponse(DAILY_LIMIT_MESSAGE);
    }

    let messages: NamasteUIMessage[];
    try {
      const body = (await request.json()) as { messages?: NamasteUIMessage[] };
      messages = body.messages ?? [];
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const question = latestUserText(messages);
    if (!question) {
      return Response.json({ error: 'No user question in messages' }, { status: 400 });
    }

    const vector = await deps.embedding.embedQuery(question);
    const matches = await deps.vectorStore.search(vector, {
      workspaceId: deps.workspaceId,
      limit: deps.topK ?? 8,
    });

    // Hydration is the leak guard: a vector whose Postgres row is gone (a
    // half-failed delete, a stale index) cannot be served, because the join
    // simply doesn't return it.
    const rows = await deps.hydrateChunks(matches.map((m) => m.chunkId));
    const byId = new Map(rows.map((r) => [r.chunkId, r]));
    const chunks: HydratedChunk[] = matches.flatMap((m) => {
      const row = byId.get(m.chunkId);
      return row ? [{ ...row, score: m.score }] : [];
    });

    const confident =
      chunks.length > 0 && chunks[0]!.score >= deps.abstentionThreshold;

    if (!confident) {
      return fixedMessageResponse(ABSTENTION_MESSAGE);
    }

    const sources: ChatSource[] = chunks.map((c, i) => ({
      n: i + 1,
      videoTitle: c.videoTitle,
      youtubeVideoId: c.youtubeVideoId,
      startSeconds: c.startSeconds,
      endSeconds: c.endSeconds,
      url: youtubeDeepLink(c.youtubeVideoId, c.startSeconds),
    }));

    const stream = createUIMessageStream<NamasteUIMessage>({
      execute: async ({ writer }) => {
        writer.write({ type: 'start' });
        // Sources are known now, before generation begins — send them first so
        // the panel renders while the model is still thinking.
        writer.write({ type: 'data-sources', id: 'sources', data: sources });
        const result = streamText({
          model: deps.chatModel,
          system: buildSystemPrompt(chunks),
          messages: await convertToModelMessages(messages),
        });
        writer.merge(result.toUIMessageStream({ sendStart: false }));
      },
    });
    return createUIMessageStreamResponse({ stream });
  };
}

/** A canned assistant turn (abstention, daily cap) with an empty source list. */
function fixedMessageResponse(text: string): Response {
  const stream = createUIMessageStream<NamasteUIMessage>({
    execute: ({ writer }: { writer: UIMessageStreamWriter<NamasteUIMessage> }) => {
      writer.write({ type: 'start' });
      writer.write({ type: 'data-sources', id: 'sources', data: [] });
      writer.write({ type: 'text-start', id: 'fixed' });
      writer.write({ type: 'text-delta', id: 'fixed', delta: text });
      writer.write({ type: 'text-end', id: 'fixed' });
      writer.write({ type: 'finish' });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function latestUserText(messages: readonly UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]!;
    if (message.role !== 'user') continue;
    return message.parts
      .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
      .map((p) => p.text)
      .join('\n')
      .trim();
  }
  return '';
}
