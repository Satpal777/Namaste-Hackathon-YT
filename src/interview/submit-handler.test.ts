import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createSubmitHandler, type SubmitHandlerDeps } from './submit-handler';
import type { Db } from '../db/client';
import * as schema from '../db/schema';

describe('quiz submit handler', () => {
  let selectMock: any;
  let updateMock: any;
  let fakeDb: Db;
  let mockQuestions: any[];
  let mockAttempts: any[];
  let mockAllAnswered: any[];

  beforeEach(() => {
    mockQuestions = [
      {
        id: 'q-1',
        attemptId: 'attempt-123',
        userId: 'user-123',
        position: 0,
        topic: 'hoisting',
        difficulty: 'foundational',
        grounded: true,
        stem: 'What is hoisting?',
        options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
        correctIndex: 0,
        explanation: 'Hoisting moves declarations.',
        sourceVideoId: 'video-1',
        sourceVideoTitle: 'Title 1',
        sourceStartSeconds: 10,
        sourceEndSeconds: 40,
        chosenIndex: null,
        correct: null,
      },
      {
        id: 'q-2',
        attemptId: 'attempt-123',
        userId: 'user-123',
        position: 1,
        topic: 'scope',
        difficulty: 'foundational',
        grounded: false,
        stem: 'What is scope?',
        options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
        correctIndex: 1,
        explanation: 'Scope is context.',
        sourceVideoId: null,
        sourceVideoTitle: null,
        sourceStartSeconds: null,
        sourceEndSeconds: null,
        chosenIndex: null,
        correct: null,
      },
    ];

    mockAttempts = [
      {
        id: 'attempt-123',
        userId: 'user-123',
        total: 2,
        score: null,
        createdAt: new Date(),
        submittedAt: null,
      },
    ];

    mockAllAnswered = [
      { topic: 'hoisting', correct: true },
      { topic: 'scope', correct: false },
    ];

    // Mock Drizzle select
    selectMock = vi.fn().mockImplementation(() => {
      return {
        from: vi.fn().mockImplementation((table) => {
          const isAttempts = table === schema.quizAttempts;
          return {
            where: vi.fn().mockImplementation(() => {
              let result = isAttempts ? mockAttempts : mockQuestions;
              return {
                orderBy: vi.fn().mockResolvedValue(result),
                innerJoin: vi.fn().mockImplementation(() => {
                  return {
                    where: vi.fn().mockResolvedValue(mockAllAnswered),
                  };
                }),
                then: (onfulfilled: any) => Promise.resolve(result).then(onfulfilled),
              };
            }),
            innerJoin: vi.fn().mockImplementation(() => {
              return {
                where: vi.fn().mockResolvedValue(mockAllAnswered),
              };
            }),
            then: (onfulfilled: any) => Promise.resolve([]).then(onfulfilled),
          };
        }),
      };
    });

    // Mock Drizzle update
    updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    });

    fakeDb = {
      select: selectMock,
      update: updateMock,
    } as unknown as Db;
  });

  function makeDeps(overrides: Partial<SubmitHandlerDeps> = {}): SubmitHandlerDeps {
    return {
      db: fakeDb,
      ...overrides,
    };
  }

  function createRequest(body: any): Request {
    return new Request('http://test/api/interview/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('grades answers correctly, updates DB, and aggregates topic mastery', async () => {
    const handler = createSubmitHandler(makeDeps());
    const req = createRequest({
      attemptId: 'attempt-123',
      answers: [
        { questionId: 'q-1', chosenIndex: 0 }, // Correct
        { questionId: 'q-2', chosenIndex: 2 }, // Incorrect (correctIndex is 1)
      ],
    });

    const response = await handler(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.score).toBe(1);
    expect(data.total).toBe(2);

    expect(data.results[0].correct).toBe(true);
    expect(data.results[0].chosenIndex).toBe(0);

    expect(data.results[1].correct).toBe(false);
    expect(data.results[1].chosenIndex).toBe(2);
    expect(data.results[1].recommendation).toBeNull(); // not grounded

    // Grounded incorrect questions should include recommendations, but q-1 was correct
    // Let's verify update is called for both questions and the attempt
    expect(updateMock).toHaveBeenCalledTimes(3); // 2 questions + 1 attempt
  });

  it('returns recommendations for missed grounded questions', async () => {
    // Make first question incorrect
    const handler = createSubmitHandler(makeDeps());
    const req = createRequest({
      attemptId: 'attempt-123',
      answers: [
        { questionId: 'q-1', chosenIndex: 2 }, // Incorrect (correctIndex is 0), grounded
        { questionId: 'q-2', chosenIndex: 1 }, // Correct
      ],
    });

    const response = await handler(req);
    const data = await response.json();
    expect(data.score).toBe(1);
    expect(data.results[0].correct).toBe(false);
    expect(data.results[0].recommendation).not.toBeNull();
    expect(data.results[0].recommendation.youtubeVideoId).toBe('video-1');
    expect(data.results[0].recommendation.url).toContain('https://www.youtube.com/watch?v=video-1&t=10s');
  });

  it('returns idempotent results if already submitted', async () => {
    // Mark attempt as submitted
    mockAttempts[0].submittedAt = new Date();
    mockAttempts[0].score = 2;
    mockQuestions[0].chosenIndex = 0;
    mockQuestions[0].correct = true;
    mockQuestions[1].chosenIndex = 1;
    mockQuestions[1].correct = true;

    const handler = createSubmitHandler(makeDeps());
    const req = createRequest({
      attemptId: 'attempt-123',
      answers: [], // empty, should not matter as it skips grading
    });

    const response = await handler(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.score).toBe(2);
    expect(updateMock).not.toHaveBeenCalled(); // skips grading db updates
  });

  it('returns 404 if attempt is not found', async () => {
    mockAttempts = []; // empty
    const handler = createSubmitHandler(makeDeps());
    const req = createRequest({ attemptId: 'non-existent' });

    const response = await handler(req);
    expect(response.status).toBe(404);
  });

  it('returns 400 on invalid payload or missing attemptId', async () => {
    const handler = createSubmitHandler(makeDeps());
    const req = createRequest({ answers: [] }); // missing attemptId

    const response = await handler(req);
    expect(response.status).toBe(400);
  });
});
