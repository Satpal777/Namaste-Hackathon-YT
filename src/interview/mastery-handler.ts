import type { Db } from '../db/client';
import { calculateTopicMastery } from './mastery';

export interface MasteryHandlerDeps {
  readonly db: Db;
}

export function createMasteryHandler(deps: MasteryHandlerDeps) {
  return async function handleMastery(request: Request): Promise<Response> {
    // 1. Identify User Session (cookie or header)
    const cookiesHeader = request.headers.get('cookie') ?? '';
    const userIdCookie = cookiesHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('user_id='))
      ?.split('=')[1];

    let userId = request.headers.get('x-user-id') ?? userIdCookie;
    let newUserIdSet = false;

    if (!userId) {
      userId = crypto.randomUUID();
      newUserIdSet = true;
    }

    // 2. Calculate Mastery Scores
    const topicScores = await calculateTopicMastery(deps.db, userId);

    // 3. Respond
    const response = Response.json({ topicScores });
    if (newUserIdSet) {
      response.headers.set(
        'Set-Cookie',
        `user_id=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
      );
    }
    return response;
  };
}
