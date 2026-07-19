import { describe, expect, it } from 'vitest';
import { MockLanguageModelV3, simulateReadableStream } from 'ai/test';
import type { EmbeddingProvider } from '../embeddings/embedding-provider';
import type { VectorMatch, VectorStore } from '../vectors/vector-store';
import { ABSTENTION_MESSAGE, DAILY_LIMIT_MESSAGE } from './contract';
import { createChatHandler, type ChatHandlerDeps } from './handler';
import type { HydratedChunkRow } from './hydrated-chunk';
import type { RateLimiter } from './rate-limit';

// --- fakes at the four product seams ---

const fakeEmbedding: EmbeddingProvider = {
  provider: 'fake',
  model: 'fake-embedding',
  dimensions: 3,
  embedDocuments: async (texts) => texts.map(() => [0, 0, 1]),
  embedQuery: async () => [0, 0, 1],
};

function fakeVectorStore(
  matches: VectorMatch[],
  searchCalls: { workspaceId: string; limit: number }[] = [],
): VectorStore {
  return {
    collectionName: 'njs_chunks_fake_3',
    ensureCollection: async () => {},
    describeCollection: async () => ({ dimensions: 3 }),
    upsert: async () => {},
    search: async (_vector, options) => {
      searchCalls.push(options);
      return matches;
    },
  };
}

const rows: HydratedChunkRow[] = [
  {
    chunkId: 'chunk-closures',
    text: 'A closure is a function bundled with its lexical environment.',
    startSeconds: 872,
    endSeconds: 910,
    videoTitle: 'Closures in JS | Namaste JavaScript Episode 10',
    youtubeVideoId: 'qikxEIxsXco',
  },
  {
    chunkId: 'chunk-scope',
    text: 'Lexical environment is local memory plus the parent reference.',
    startSeconds: 300,
    endSeconds: 340,
    videoTitle: 'The Scope Chain | Namaste JavaScript Ep. 7',
    youtubeVideoId: 'uH-tVP8MUs8',
  },
];

const hydrate = async (ids: readonly string[]) =>
  rows.filter((r) => ids.includes(r.chunkId));

const finishChunk = {
  type: 'finish' as const,
  finishReason: { unified: 'stop' as const, raw: undefined },
  usage: {
    inputTokens: { total: 10, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: 10, text: 10, reasoning: undefined },
  },
};

function answeringModel() {
  return new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'stream-start' as const, warnings: [] },
          { type: 'text-start' as const, id: 't' },
          {
            type: 'text-delta' as const,
            id: 't',
            delta: 'A closure is a function with its lexical scope [1].',
          },
          { type: 'text-end' as const, id: 't' },
          finishChunk,
        ],
      }),
    }),
  });
}

function explodingModel() {
  return new MockLanguageModelV3({
    doStream: async () => {
      throw new Error('the model must not be called when abstaining');
    },
  });
}

function makeDeps(overrides: Partial<ChatHandlerDeps> = {}): ChatHandlerDeps {
  return {
    embedding: fakeEmbedding,
    vectorStore: fakeVectorStore([
      { chunkId: 'chunk-closures', score: 0.82 },
      { chunkId: 'chunk-scope', score: 0.7 },
    ]),
    hydrateChunks: hydrate,
    chatModel: answeringModel(),
    workspaceId: 'ws_demo',
    abstentionThreshold: 0.35,
    ...overrides,
  };
}

function ask(question = 'What is a closure?'): Request {
  return new Request('http://test/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { id: 'm1', role: 'user', parts: [{ type: 'text', text: question }] },
      ],
    }),
  });
}

/** Parses the SSE body into the ordered list of stream chunks. */
async function sseChunks(response: Response): Promise<{ type: string; [k: string]: unknown }[]> {
  const body = await response.text();
  return body
    .split('\n')
    .filter((line) => line.startsWith('data: ') && line !== 'data: [DONE]')
    .map((line) => JSON.parse(line.slice('data: '.length)));
}

describe('chat endpoint', () => {
  it('sends the sources frame before the first text token', async () => {
    const response = await createChatHandler(makeDeps())(ask());
    expect(response.status).toBe(200);

    const chunks = await sseChunks(response);
    const sourcesAt = chunks.findIndex((c) => c.type === 'data-sources');
    const firstTextAt = chunks.findIndex((c) => c.type === 'text-delta');
    expect(sourcesAt).toBeGreaterThanOrEqual(0);
    expect(firstTextAt).toBeGreaterThanOrEqual(0);
    expect(sourcesAt).toBeLessThan(firstTextAt);
  });

  it('numbers sources to match the [n] markers and links to the exact second', async () => {
    const response = await createChatHandler(makeDeps())(ask());
    const chunks = await sseChunks(response);

    const sources = chunks.find((c) => c.type === 'data-sources')?.data as {
      n: number;
      url: string;
      youtubeVideoId: string;
    }[];
    expect(sources.map((s) => s.n)).toEqual([1, 2]);
    expect(sources[0]!.url).toBe('https://www.youtube.com/watch?v=qikxEIxsXco&t=872s');

    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => c.delta)
      .join('');
    expect(text).toContain('[1]');
  });

  it('always applies the workspace filter to vector search', async () => {
    const searchCalls: { workspaceId: string; limit: number }[] = [];
    const deps = makeDeps({
      vectorStore: fakeVectorStore(
        [{ chunkId: 'chunk-closures', score: 0.82 }],
        searchCalls,
      ),
    });
    await createChatHandler(deps)(ask());

    expect(searchCalls).toHaveLength(1);
    expect(searchCalls[0]!.workspaceId).toBe('ws_demo');
  });

  it('never serves a chunk whose Postgres row is gone (the orphan case)', async () => {
    const deps = makeDeps({
      vectorStore: fakeVectorStore([
        { chunkId: 'orphaned-vector', score: 0.95 },
        { chunkId: 'chunk-closures', score: 0.82 },
      ]),
    });
    const response = await createChatHandler(deps)(ask());
    const chunks = await sseChunks(response);

    const sources = chunks.find((c) => c.type === 'data-sources')?.data as {
      n: number;
      youtubeVideoId: string;
    }[];
    expect(sources).toHaveLength(1);
    expect(sources[0]!.youtubeVideoId).toBe('qikxEIxsXco');
    expect(sources[0]!.n).toBe(1);
  });

  it('gives the model only the numbered excerpts that were sent as sources', async () => {
    let systemPrompt = '';
    const model = new MockLanguageModelV3({
      doStream: async (options) => {
        const system = options.prompt.find((m) => m.role === 'system');
        systemPrompt = typeof system?.content === 'string' ? system.content : '';
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'stream-start' as const, warnings: [] },
              { type: 'text-start' as const, id: 't' },
              { type: 'text-delta' as const, id: 't', delta: 'ok [1]' },
              { type: 'text-end' as const, id: 't' },
              finishChunk,
            ],
          }),
        };
      },
    });
    const response = await createChatHandler(makeDeps({ chatModel: model }))(ask());
    await response.text();

    expect(systemPrompt).toContain('[1] (Closures in JS | Namaste JavaScript Episode 10, 14:32–15:10)');
    expect(systemPrompt).toContain('A closure is a function bundled with its lexical environment.');
    expect(systemPrompt).toContain('[2] (The Scope Chain | Namaste JavaScript Ep. 7');
  });

  it('abstains below the threshold: fixed message, empty sources, no model call', async () => {
    const deps = makeDeps({
      vectorStore: fakeVectorStore([{ chunkId: 'chunk-closures', score: 0.12 }]),
      chatModel: explodingModel(),
    });
    const response = await createChatHandler(deps)(ask('how do I bake bread?'));
    expect(response.status).toBe(200);

    const chunks = await sseChunks(response);
    const sources = chunks.find((c) => c.type === 'data-sources')?.data;
    expect(sources).toEqual([]);
    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => c.delta)
      .join('');
    expect(text).toBe(ABSTENTION_MESSAGE);
  });

  it('abstains when nothing survives hydration, whatever the scores said', async () => {
    const deps = makeDeps({
      vectorStore: fakeVectorStore([{ chunkId: 'orphaned-vector', score: 0.99 }]),
      chatModel: explodingModel(),
    });
    const response = await createChatHandler(deps)(ask());
    const chunks = await sseChunks(response);

    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => c.delta)
      .join('');
    expect(text).toBe(ABSTENTION_MESSAGE);
  });

  it('returns 429 when the per-IP window is exhausted, before any retrieval', async () => {
    const searchCalls: { workspaceId: string; limit: number }[] = [];
    const limiter: RateLimiter = { check: async () => 'ip-limited' };
    const deps = makeDeps({
      rateLimiter: limiter,
      vectorStore: fakeVectorStore([{ chunkId: 'chunk-closures', score: 0.9 }], searchCalls),
      chatModel: explodingModel(),
    });
    const response = await createChatHandler(deps)(ask());

    expect(response.status).toBe(429);
    expect(searchCalls).toHaveLength(0);
  });

  it('closes politely for the day when the global budget cap is reached', async () => {
    const limiter: RateLimiter = { check: async () => 'daily-cap-reached' };
    const deps = makeDeps({ rateLimiter: limiter, chatModel: explodingModel() });
    const response = await createChatHandler(deps)(ask());

    expect(response.status).toBe(200);
    const chunks = await sseChunks(response);
    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => c.delta)
      .join('');
    expect(text).toBe(DAILY_LIMIT_MESSAGE);
  });

  it('rejects a body with no user question', async () => {
    const response = await createChatHandler(makeDeps())(
      new Request('http://test/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it('replies to a greeting without hitting retrieval or the model', async () => {
    const searchCalls: { workspaceId: string; limit: number }[] = [];
    const deps = makeDeps({
      vectorStore: fakeVectorStore([], searchCalls),
      chatModel: explodingModel(),
    });
    const response = await createChatHandler(deps)(ask('hello'));
    expect(response.status).toBe(200);
    expect(searchCalls).toHaveLength(0);

    const chunks = await sseChunks(response);
    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => c.delta)
      .join('');
    expect(text).toContain('Namaste');
  });

  it('replies to gratitude without retrieval', async () => {
    const searchCalls: { workspaceId: string; limit: number }[] = [];
    const deps = makeDeps({
      vectorStore: fakeVectorStore([], searchCalls),
      chatModel: explodingModel(),
    });
    const response = await createChatHandler(deps)(ask('thanks!'));
    expect(response.status).toBe(200);
    expect(searchCalls).toHaveLength(0);

    const chunks = await sseChunks(response);
    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => c.delta)
      .join('');
    expect(text).toContain('welcome');
  });

  it('replies to capability questions without retrieval', async () => {
    const searchCalls: { workspaceId: string; limit: number }[] = [];
    const deps = makeDeps({
      vectorStore: fakeVectorStore([], searchCalls),
      chatModel: explodingModel(),
    });
    const response = await createChatHandler(deps)(ask('what can you do?'));
    expect(response.status).toBe(200);
    expect(searchCalls).toHaveLength(0);

    const chunks = await sseChunks(response);
    const text = chunks
      .filter((c) => c.type === 'text-delta')
      .map((c) => c.delta)
      .join('');
    expect(text).toContain('Namaste JavaScript');
  });

  it('falls through to retrieval when the greeting is part of a real question', async () => {
    const searchCalls: { workspaceId: string; limit: number }[] = [];
    const deps = makeDeps({
      vectorStore: fakeVectorStore(
        [{ chunkId: 'chunk-closures', score: 0.82 }],
        searchCalls,
      ),
    });
    await createChatHandler(deps)(ask('hi, what is a closure?'));
    // Not intercepted as a greeting — retrieval ran
    expect(searchCalls).toHaveLength(1);
  });
});
