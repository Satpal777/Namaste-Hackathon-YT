import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createMasteryHandler, type MasteryHandlerDeps } from './mastery-handler';
import type { Db } from '../db/client';
import * as schema from '../db/schema';

describe('quiz mastery handler', () => {
  let selectMock: any;
  let fakeDb: Db;
  let mockAllAnswered: any[];

  beforeEach(() => {
    mockAllAnswered = [
      { topic: 'hoisting', correct: true },
      { topic: 'hoisting', correct: true },
      { topic: 'closures', correct: false },
    ];

    selectMock = vi.fn().mockImplementation(() => {
      return {
        from: vi.fn().mockImplementation(() => {
          return {
            innerJoin: vi.fn().mockImplementation(() => {
              return {
                where: vi.fn().mockResolvedValue(mockAllAnswered),
              };
            }),
          };
        }),
      };
    });

    fakeDb = {
      select: selectMock,
    } as unknown as Db;
  });

  function makeDeps(overrides: Partial<MasteryHandlerDeps> = {}): MasteryHandlerDeps {
    return {
      db: fakeDb,
      ...overrides,
    };
  }

  function createRequest(options: { userId?: string; cookie?: string } = {}): Request {
    const headers = new Headers();
    if (options.userId) {
      headers.set('x-user-id', options.userId);
    }
    if (options.cookie) {
      headers.set('cookie', options.cookie);
    }

    return new Request('http://test/api/interview/mastery', {
      method: 'GET',
      headers,
    });
  }

  it('calculates mastery scores correctly with Laplace smoothing', async () => {
    const handler = createMasteryHandler(makeDeps());
    const response = await handler(createRequest({ userId: 'user-123' }));
    expect(response.status).toBe(200);

    const data = await response.json();
    const scores = data.topicScores;
    expect(scores).toBeDefined();

    // hoisting: 2 correct, 2 seen -> (2 + 1) / (2 + 2) = 3/4 = 0.75
    const hoisting = scores.find((s: any) => s.topic === 'hoisting');
    expect(hoisting.seen).toBe(2);
    expect(hoisting.correct).toBe(2);
    expect(hoisting.mastery).toBe(0.75);

    // closures: 0 correct, 1 seen -> (0 + 1) / (1 + 2) = 1/3 = ~0.33
    const closures = scores.find((s: any) => s.topic === 'closures');
    expect(closures.seen).toBe(1);
    expect(closures.correct).toBe(0);
    expect(Math.abs(closures.mastery - 0.3333)).toBeLessThan(0.01);

    // scope: 0 correct, 0 seen (canonical, but unseen) -> (0 + 1) / (0 + 2) = 0.5
    const scope = scores.find((s: any) => s.topic === 'scope');
    expect(scope.seen).toBe(0);
    expect(scope.correct).toBe(0);
    expect(scope.mastery).toBe(0.5);
  });

  it('sets a user_id cookie in the response if none was provided', async () => {
    const handler = createMasteryHandler(makeDeps());
    const response = await handler(createRequest());
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain('user_id=');
  });
});
