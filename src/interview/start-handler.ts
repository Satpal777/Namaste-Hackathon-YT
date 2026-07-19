import { generateText, type LanguageModel } from 'ai';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import type { Difficulty, QuizQuestionPublic, QuizStartResponse } from './contract';

export interface StartHandlerDeps {
  readonly db: Db;
  readonly chatModel: LanguageModel;
  readonly workspaceId: string;
}

interface GeneratedQuestion {
  topic: string;
  topicLabel: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  grounded: boolean;
  sourceVideoId?: string | null;
  sourceVideoTitle?: string | null;
  sourceStartSeconds?: number | null;
  sourceEndSeconds?: number | null;
}

const GROUNDED_FALLBACKS: readonly GeneratedQuestion[] = [
  {
    topic: 'closures',
    topicLabel: 'Closures',
    stem: 'What is a closure in JavaScript?',
    options: [
      'A function bundled with its lexical environment',
      'A method to terminate event propagation',
      'A syntax pattern to declare private variables',
      'An immediately invoked function execution context',
    ],
    correctIndex: 0,
    explanation: 'A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment).',
    grounded: true,
  },
  {
    topic: 'hoisting',
    topicLabel: 'Hoisting',
    stem: 'What happens to function and variable declarations during the hoisting phase?',
    options: [
      'They are moved to the top of their enclosing scope before execution',
      'They are deleted to free memory',
      'They are executed immediately in global scope',
      'They are converted to let or const declarations',
    ],
    correctIndex: 0,
    explanation: 'Hoisting is JavaScript\'s default behavior of moving declarations to the top of the current scope before code execution.',
    grounded: true,
  },
  {
    topic: 'promises',
    topicLabel: 'Promises',
    stem: 'Which promise API resolves as soon as the first promise resolves, or rejects if all promises reject?',
    options: [
      'Promise.any',
      'Promise.race',
      'Promise.all',
      'Promise.allSettled',
    ],
    correctIndex: 0,
    explanation: 'Promise.any resolves as soon as any of the input promises resolves, and rejects only if all of them reject.',
    grounded: true,
  },
];

const UNGROUNDED_FALLBACKS: readonly GeneratedQuestion[] = [
  {
    topic: 'scope',
    topicLabel: 'Scope',
    stem: 'What is the scoping behaviour of variables declared using block-scoped keywords let or const?',
    options: [
      'They are restricted to the block where they are defined',
      'They are hoisted to function scope and initialized to undefined',
      'They are accessible anywhere in the same module',
      'They become properties of the global window object',
    ],
    correctIndex: 0,
    explanation: 'Variables declared with let and const are block-scoped and cannot be accessed outside the enclosing block.',
    grounded: false,
  },
  {
    topic: 'event-loop',
    topicLabel: 'Event Loop',
    stem: 'How does the browser event loop prioritize executing items in the Microtask Queue versus the Callback Queue?',
    options: [
      'All microtasks execute first before any callback queue task is run',
      'They are executed in alternating order',
      'The Callback Queue has higher priority',
      'They run concurrently on separate threads',
    ],
    correctIndex: 0,
    explanation: 'The Microtask Queue has higher priority; the Event Loop will process all microtasks before moving to Callback Queue tasks.',
    grounded: false,
  },
];

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function createStartHandler(deps: StartHandlerDeps) {
  return async function handleStart(request: Request): Promise<Response> {
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

    // 2. Parse Request Body (difficulty)
    let difficulty: Difficulty = 'foundational';
    try {
      const body = await request.json() as { difficulty?: Difficulty };
      if (body.difficulty === 'hard') {
        difficulty = 'hard';
      }
    } catch {
      // Allow empty/no-body for fallback default of 'foundational'
    }

    // 3. Retrieve Candidate Chunks from Neon Database
    const dbChunks = await deps.db
      .select({
        id: schema.chunks.id,
        text: schema.chunks.text,
        videoId: schema.chunks.videoId,
        startSeconds: schema.chunks.startSeconds,
        endSeconds: schema.chunks.endSeconds,
        videoTitle: schema.videos.title,
        youtubeVideoId: schema.videos.youtubeVideoId,
      })
      .from(schema.chunks)
      .innerJoin(schema.videos, eq(schema.chunks.videoId, schema.videos.id))
      .where(eq(schema.chunks.workspaceId, deps.workspaceId));

    // Filter to reasonably long informative chunks to avoid introductory noise
    const informativeChunks = dbChunks.filter((c) => c.text.length > 200);
    const chosenChunks = pickRandom(
      informativeChunks.length > 0 ? informativeChunks : dbChunks,
      3,
    );

    // 4. Generate Grounded and Ungrounded MCQs in Parallel using Vercel AI SDK
    const groundedPromises = chosenChunks.map(async (chunk, index) => {
      const prompt = `You are a JavaScript technical interviewer.
Generate a multiple-choice question based on the following transcript excerpt from the "Namaste JavaScript" YouTube series by Akshay Saini.

Excerpt:
"""
${chunk.text}
"""

Difficulty Level: ${difficulty}

Rules:
1. The question stem must test technical understanding of the excerpt's JS concept.
2. Provide exactly 4 options. Every option must be roughly the same length and complexity.
3. Mark the 0-based correctIndex.
4. Write a detailed explanation explaining why the correct choice is correct and why others are incorrect.
5. Select a topic category from: 'hoisting', 'closures', 'undefined-not-defined', 'promises', 'async-await', 'this-keyword', 'scope', 'event-loop'.
6. Specify a topicLabel (e.g., 'Hoisting', 'Closures', etc.).
7. Return only a JSON object matching this TypeScript interface (do not wrap in markdown code blocks, just raw JSON):
{
  "topic": string,
  "topicLabel": string,
  "stem": string,
  "options": [string, string, string, string],
  "correctIndex": number,
  "explanation": string
}
`;

      try {
        const { text } = await generateText({
          model: deps.chatModel,
          prompt,
          maxRetries: 0,
        });
        const cleaned = cleanJsonResponse(text);
        const parsed = JSON.parse(cleaned) as {
          topic: string;
          topicLabel: string;
          stem: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        };

        return {
          topic: parsed.topic || 'closures',
          topicLabel: parsed.topicLabel || 'Closures',
          stem: parsed.stem,
          options: parsed.options,
          correctIndex: parsed.correctIndex,
          explanation: parsed.explanation,
          grounded: true,
          sourceVideoId: chunk.youtubeVideoId,
          sourceVideoTitle: chunk.videoTitle,
          sourceStartSeconds: chunk.startSeconds,
          sourceEndSeconds: chunk.endSeconds,
        } as GeneratedQuestion;
      } catch (err) {
        console.error('Failed to generate grounded MCQ from LLM, using fallback:', err);
        const fallback = GROUNDED_FALLBACKS[index % GROUNDED_FALLBACKS.length]!;
        return {
          ...fallback,
          sourceVideoId: chunk.youtubeVideoId,
          sourceVideoTitle: chunk.videoTitle,
          sourceStartSeconds: chunk.startSeconds,
          sourceEndSeconds: chunk.endSeconds,
        };
      }
    });

    const ungroundedPromises = [0, 1].map(async (_, index) => {
      const prompt = `You are a JavaScript technical interviewer.
Generate a general multiple-choice question testing JavaScript concepts, execution details, or best practices (not tied to any specific transcript).

Difficulty Level: ${difficulty}

Rules:
1. The question stem must test technical JavaScript execution or concepts.
2. Provide exactly 4 options. Every option must be roughly the same length and complexity.
3. Mark the 0-based correctIndex.
4. Write a detailed explanation explaining why the correct choice is correct and why others are incorrect.
5. Select a topic category from: 'hoisting', 'closures', 'undefined-not-defined', 'promises', 'async-await', 'this-keyword', 'scope', 'event-loop'.
6. Specify a topicLabel (e.g., 'Hoisting', 'Closures', etc.).
7. Return only a JSON object matching this TypeScript interface (do not wrap in markdown code blocks, just raw JSON):
{
  "topic": string,
  "topicLabel": string,
  "stem": string,
  "options": [string, string, string, string],
  "correctIndex": number,
  "explanation": string
}
`;

      try {
        const { text } = await generateText({
          model: deps.chatModel,
          prompt,
          maxRetries: 0,
        });
        const cleaned = cleanJsonResponse(text);
        const parsed = JSON.parse(cleaned) as {
          topic: string;
          topicLabel: string;
          stem: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        };

        return {
          topic: parsed.topic || 'scope',
          topicLabel: parsed.topicLabel || 'Scope',
          stem: parsed.stem,
          options: parsed.options,
          correctIndex: parsed.correctIndex,
          explanation: parsed.explanation,
          grounded: false,
          sourceVideoId: null,
          sourceVideoTitle: null,
          sourceStartSeconds: null,
          sourceEndSeconds: null,
        } as GeneratedQuestion;
      } catch (err) {
        console.error('Failed to generate ungrounded MCQ from LLM, using fallback:', err);
        return {
          ...UNGROUNDED_FALLBACKS[index % UNGROUNDED_FALLBACKS.length]!,
          sourceVideoId: null,
          sourceVideoTitle: null,
          sourceStartSeconds: null,
          sourceEndSeconds: null,
        };
      }
    });

    const [groundedResults, ungroundedResults] = await Promise.all([
      Promise.all(groundedPromises),
      Promise.all(ungroundedPromises),
    ]);

    const generatedQuestions = [...groundedResults, ...ungroundedResults];

    // 5. Store Attempt and Questions in Postgres
    const attemptId = crypto.randomUUID();
    await deps.db.insert(schema.quizAttempts).values({
      id: attemptId,
      userId,
      total: generatedQuestions.length,
      score: null,
    });

    const storedQuestions = await Promise.all(
      generatedQuestions.map(async (q, idx) => {
        const id = crypto.randomUUID();
        await deps.db.insert(schema.quizQuestions).values({
          id,
          attemptId,
          userId,
          position: idx,
          topic: q.topic,
          difficulty,
          grounded: q.grounded,
          stem: q.stem,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          sourceVideoId: q.sourceVideoId,
          sourceVideoTitle: q.sourceVideoTitle,
          sourceStartSeconds: q.sourceStartSeconds ? Number(q.sourceStartSeconds) : null,
          sourceEndSeconds: q.sourceEndSeconds ? Number(q.sourceEndSeconds) : null,
          chosenIndex: null,
          correct: null,
        });

        return {
          id,
          position: idx,
          topic: q.topic,
          topicLabel: q.topicLabel,
          difficulty,
          grounded: q.grounded,
          stem: q.stem,
          options: q.options,
        } as QuizQuestionPublic;
      }),
    );

    // 6. Return response with Set-Cookie if user session was newly generated
    const responsePayload: QuizStartResponse = {
      attemptId,
      questions: storedQuestions,
    };

    const response = Response.json(responsePayload);
    if (newUserIdSet) {
      response.headers.set(
        'Set-Cookie',
        `user_id=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
      );
    }
    return response;
  };
}
