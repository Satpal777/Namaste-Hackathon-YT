import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MockLanguageModelV3 } from 'ai/test';
import { createStartHandler, type StartHandlerDeps } from './start-handler';
import type { Db } from '../db/client';

describe('quiz start handler', () => {
  let selectMock: any;
  let insertMock: any;
  let fakeDb: Db;
  let modelCalls: string[];

  beforeEach(() => {
    modelCalls = [];
    selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue([
            {
              id: 'c-1',
              text: 'Hoisting is a JavaScript mechanism where variables and function declarations are moved to the top of their scope before execution.',
              videoId: 'v-1',
              startSeconds: 100,
              endSeconds: 120,
              videoTitle: 'Episode 1: Hoisting',
              youtubeVideoId: 'yt-1',
            },
            {
              id: 'c-2',
              text: 'Closures are functions that reference outer variables from their lexical scope, even after the outer function has returned.',
              videoId: 'v-2',
              startSeconds: 200,
              endSeconds: 230,
              videoTitle: 'Episode 2: Closures',
              youtubeVideoId: 'yt-2',
            },
            {
              id: 'c-3',
              text: 'Promises represent the eventual completion or failure of an asynchronous operation, allowing cleaner flow control than callbacks.',
              videoId: 'v-3',
              startSeconds: 300,
              endSeconds: 350,
              videoTitle: 'Episode 3: Promises',
              youtubeVideoId: 'yt-3',
            },
          ]),
        }),
      }),
    });

    insertMock = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    fakeDb = {
      select: selectMock,
      insert: insertMock,
    } as unknown as Db;
  });

  function makeMockModel(shouldThrow = false) {
    return new MockLanguageModelV3({
      doGenerate: async (options) => {
        const promptString = JSON.stringify(options.prompt);
        modelCalls.push(promptString);
        if (shouldThrow) {
          throw new Error('LLM rate limit reached');
        }

        // Return a mock MCQ JSON matching our prompt instructions
        const isGrounded = promptString.includes('Excerpt:');
        const json = {
          topic: isGrounded ? 'closures' : 'scope',
          topicLabel: isGrounded ? 'Closures' : 'Scope',
          stem: isGrounded ? 'What is a closure?' : 'What is block scope?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: 0,
          explanation: 'Because it is correct.',
        };

        return {
          text: JSON.stringify(json),
          finishReason: 'stop',
          usage: { inputTokens: 5, outputTokens: 10 },
          content: [{ type: 'text', text: JSON.stringify(json) }],
          warnings: [],
          rawCall: { rawPrompt: null, rawSettings: {} },
        } as any;
      },
    });
  }

  function makeDeps(overrides: Partial<StartHandlerDeps> = {}): StartHandlerDeps {
    return {
      db: fakeDb,
      chatModel: makeMockModel(),
      workspaceId: 'demo',
      ...overrides,
    };
  }

  function createRequest(options: {
    userId?: string;
    difficulty?: string;
    cookie?: string;
  } = {}): Request {
    const headers = new Headers();
    headers.set('content-type', 'application/json');
    if (options.userId) {
      headers.set('x-user-id', options.userId);
    }
    if (options.cookie) {
      headers.set('cookie', options.cookie);
    }

    return new Request('http://test/api/interview/start', {
      method: 'POST',
      headers,
      body: JSON.stringify({ difficulty: options.difficulty ?? 'foundational' }),
    });
  }

  it('generates exactly 5 questions (3 grounded, 2 ungrounded)', async () => {
    const handler = createStartHandler(makeDeps());
    const response = await handler(createRequest({ userId: 'user-123' }));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.attemptId).toBeDefined();
    expect(data.questions).toHaveLength(5);

    const groundedCount = data.questions.filter((q: any) => q.grounded).length;
    const ungroundedCount = data.questions.filter((q: any) => !q.grounded).length;
    expect(groundedCount).toBe(3);
    expect(ungroundedCount).toBe(2);

    expect(modelCalls).toHaveLength(5);
  });

  it('omits answer keys, explanations, and video recommendations from public response', async () => {
    const handler = createStartHandler(makeDeps());
    const response = await handler(createRequest({ userId: 'user-123' }));
    const data = await response.json();

    for (const q of data.questions) {
      expect(q.correctIndex).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.sourceVideoId).toBeUndefined();
      expect(q.sourceVideoTitle).toBeUndefined();
      expect(q.sourceStartSeconds).toBeUndefined();
      expect(q.sourceEndSeconds).toBeUndefined();
    }
  });

  it('sets a user_id cookie in the response if none was provided', async () => {
    const handler = createStartHandler(makeDeps());
    const response = await handler(createRequest()); // no userId or cookie header
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain('user_id=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('uses user_id cookie if provided', async () => {
    const handler = createStartHandler(makeDeps());
    const response = await handler(createRequest({ cookie: 'user_id=existing-user-id' }));
    expect(response.headers.get('Set-Cookie')).toBeNull(); // should not set new cookie
  });

  it('recovers gracefully using fallback questions if LLM throws an error', async () => {
    const deps = makeDeps({ chatModel: makeMockModel(true) }); // model throws
    const handler = createStartHandler(deps);
    const response = await handler(createRequest({ userId: 'user-123' }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.questions).toHaveLength(5);
    expect(data.questions.filter((q: any) => q.grounded)).toHaveLength(3);
    expect(data.questions.filter((q: any) => !q.grounded)).toHaveLength(2);
  });
});
