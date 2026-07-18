import { createOpenAI } from '@ai-sdk/openai';
import { createChatHandler } from '~/chat/handler';
import { createChunkHydrator } from '~/chat/hydrate';
import { unlimited } from '~/chat/rate-limit';
import { createUpstashRateLimiter } from '~/chat/upstash-rate-limiter';
import { loadConfig } from '~/config';
import { createDb } from '~/db/client';
import { DEMO_WORKSPACE_ID } from '~/db/workspace';
import { createEmbeddingProvider } from '~/embeddings/providers';
import { collectionNameFor } from '~/vectors/collection-name';
import { QdrantVectorStore } from '~/vectors/qdrant-vector-store';
import { assertVectorSpaceMatches } from '~/vectors/startup-assertion';

export const maxDuration = 60;

type Handler = (request: Request) => Promise<Response>;

// Built on first request, not at module load: `next build` imports this file
// without the runtime environment. The startup assertion runs exactly once per
// instance — a mismatched vector space refuses to serve rather than serving
// wrong neighbours.
let handlerPromise: Promise<Handler> | undefined;

async function buildHandler(): Promise<Handler> {
  const config = loadConfig();
  const embedding = createEmbeddingProvider(config.provider);
  const vectorStore = new QdrantVectorStore({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
    collectionName: collectionNameFor(embedding),
    dimensions: embedding.dimensions,
  });
  await assertVectorSpaceMatches(vectorStore, embedding);

  const chatProvider = createOpenAI({
    baseURL: config.chat.baseURL,
    apiKey: config.chat.apiKey,
  });

  return createChatHandler({
    embedding,
    vectorStore,
    hydrateChunks: createChunkHydrator(createDb(config.databaseUrl), DEMO_WORKSPACE_ID),
    chatModel: chatProvider.chat(config.chat.model),
    workspaceId: DEMO_WORKSPACE_ID,
    abstentionThreshold: config.abstentionThreshold,
    rateLimiter: config.rateLimit
      ? createUpstashRateLimiter({
          url: config.rateLimit.url,
          token: config.rateLimit.token,
          dailyCap: config.rateLimit.dailyCap,
        })
      : unlimited,
  });
}

export async function POST(request: Request): Promise<Response> {
  handlerPromise ??= buildHandler();
  try {
    const handler = await handlerPromise;
    return await handler(request);
  } catch (error) {
    // Let the next request retry the boot (the collection may have been seeded
    // or the env fixed since), but never swallow the reason.
    handlerPromise = undefined;
    console.error('chat endpoint failed to start:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Chat endpoint unavailable' },
      { status: 503 },
    );
  }
}
