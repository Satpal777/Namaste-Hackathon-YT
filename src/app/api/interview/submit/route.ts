import { createSubmitHandler } from '~/interview/submit-handler';
import { loadConfig } from '~/config';
import { createDb } from '~/db/client';

export const maxDuration = 60;

type Handler = (request: Request) => Promise<Response>;

let handlerPromise: Promise<Handler> | undefined;

async function buildHandler(): Promise<Handler> {
  const config = loadConfig();

  return createSubmitHandler({
    db: createDb(config.databaseUrl),
  });
}

export async function POST(request: Request): Promise<Response> {
  handlerPromise ??= buildHandler();
  try {
    const handler = await handlerPromise;
    return await handler(request);
  } catch (error) {
    handlerPromise = undefined;
    console.error('interview submit endpoint failed to start:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Interview submit endpoint unavailable' },
      { status: 503 },
    );
  }
}
