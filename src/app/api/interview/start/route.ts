import { createOpenAI } from '@ai-sdk/openai';
import { createStartHandler } from '~/interview/start-handler';
import { loadConfig } from '~/config';
import { createDb } from '~/db/client';
import { DEMO_WORKSPACE_ID } from '~/db/workspace';

export const maxDuration = 60;

type Handler = (request: Request) => Promise<Response>;

let handlerPromise: Promise<Handler> | undefined;

async function buildHandler(): Promise<Handler> {
  const config = loadConfig();
  const chatProvider = createOpenAI({
    baseURL: config.chat.baseURL,
    apiKey: config.chat.apiKey,
  });

  return createStartHandler({
    db: createDb(config.databaseUrl),
    chatModel: chatProvider.chat(config.chat.model),
    workspaceId: DEMO_WORKSPACE_ID,
  });
}

export async function POST(request: Request): Promise<Response> {
  handlerPromise ??= buildHandler();
  try {
    const handler = await handlerPromise;
    return await handler(request);
  } catch (error) {
    handlerPromise = undefined;
    console.error('interview start endpoint failed to start:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Interview start endpoint unavailable' },
      { status: 503 },
    );
  }
}
