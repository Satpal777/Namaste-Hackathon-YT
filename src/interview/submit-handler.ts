import { eq, and, isNotNull } from 'drizzle-orm';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { youtubeDeepLink } from '../chat/contract';
import type {
  QuizResultResponse,
  QuestionResult,
  TopicScore,
  SubmitRequest,
  Recommendation,
} from './contract';

export interface SubmitHandlerDeps {
  readonly db: Db;
}

const CANONICAL_TOPICS = [
  { topic: 'hoisting', label: 'Hoisting' },
  { topic: 'closures', label: 'Closures' },
  { topic: 'undefined-not-defined', label: 'Undefined vs Not Defined' },
  { topic: 'promises', label: 'Promises & Callbacks' },
  { topic: 'async-await', label: 'Async/Await' },
  { topic: 'this-keyword', label: 'This Behavior' },
  { topic: 'scope', label: 'Scope & Lexical Environment' },
  { topic: 'event-loop', label: 'Event Loop' },
];

function getTopicLabel(topic: string): string {
  const match = CANONICAL_TOPICS.find((t) => t.topic === topic);
  if (match) return match.label;
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function createSubmitHandler(deps: SubmitHandlerDeps) {
  return async function handleSubmit(request: Request): Promise<Response> {
    // 1. Parse Request Body
    let submitRequest: SubmitRequest;
    try {
      submitRequest = (await request.json()) as SubmitRequest;
      if (!submitRequest.attemptId) {
        return Response.json({ error: 'Missing attemptId' }, { status: 400 });
      }
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { attemptId, answers } = submitRequest;

    // 2. Fetch the attempt
    const attempts = await deps.db
      .select()
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.id, attemptId));

    const attempt = attempts[0];
    if (!attempt) {
      return Response.json({ error: 'Quiz attempt not found' }, { status: 404 });
    }

    const userId = attempt.userId;

    // 3. If already submitted, return the stored results directly (idempotency)
    if (attempt.submittedAt !== null) {
      const storedQuestions = await deps.db
        .select()
        .from(schema.quizQuestions)
        .where(eq(schema.quizQuestions.attemptId, attemptId))
        .orderBy(schema.quizQuestions.position);

      const questionResults: QuestionResult[] = storedQuestions.map((q) => {
        let recommendation: Recommendation | null = null;
        if (!q.correct && q.grounded && q.sourceVideoId && q.sourceVideoTitle && q.sourceStartSeconds !== null && q.sourceEndSeconds !== null) {
          recommendation = {
            videoTitle: q.sourceVideoTitle,
            youtubeVideoId: q.sourceVideoId,
            startSeconds: q.sourceStartSeconds,
            endSeconds: q.sourceEndSeconds,
            url: youtubeDeepLink(q.sourceVideoId, q.sourceStartSeconds),
          };
        }

        return {
          id: q.id,
          position: q.position,
          topic: q.topic,
          topicLabel: getTopicLabel(q.topic),
          difficulty: q.difficulty,
          grounded: q.grounded,
          stem: q.stem,
          options: q.options,
          chosenIndex: q.chosenIndex,
          correctIndex: q.correctIndex,
          correct: q.correct ?? false,
          explanation: q.explanation,
          recommendation,
        };
      });

      const topicBreakdown = await calculateTopicMastery(deps.db, userId);

      const responsePayload: QuizResultResponse = {
        attemptId,
        score: attempt.score ?? 0,
        total: attempt.total,
        results: questionResults,
        topicBreakdown,
      };

      return Response.json(responsePayload);
    }

    // 4. Otherwise, grade the quiz
    const quizQuestionsList = await deps.db
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.attemptId, attemptId))
      .orderBy(schema.quizQuestions.position);

    if (quizQuestionsList.length === 0) {
      return Response.json({ error: 'No questions found for this attempt' }, { status: 400 });
    }

    const answersMap = new Map(answers.map((a) => [a.questionId, a.chosenIndex]));

    let correctCount = 0;

    const questionResults = await Promise.all(
      quizQuestionsList.map(async (q) => {
        const chosenIndex = answersMap.has(q.id) ? answersMap.get(q.id)! : null;
        const correct = chosenIndex === q.correctIndex;

        if (correct) {
          correctCount++;
        }

        // Save choices and correctness in the database
        await deps.db
          .update(schema.quizQuestions)
          .set({ chosenIndex, correct })
          .where(eq(schema.quizQuestions.id, q.id));

        let recommendation: Recommendation | null = null;
        if (!correct && q.grounded && q.sourceVideoId && q.sourceVideoTitle && q.sourceStartSeconds !== null && q.sourceEndSeconds !== null) {
          recommendation = {
            videoTitle: q.sourceVideoTitle,
            youtubeVideoId: q.sourceVideoId,
            startSeconds: q.sourceStartSeconds,
            endSeconds: q.sourceEndSeconds,
            url: youtubeDeepLink(q.sourceVideoId, q.sourceStartSeconds),
          };
        }

        return {
          id: q.id,
          position: q.position,
          topic: q.topic,
          topicLabel: getTopicLabel(q.topic),
          difficulty: q.difficulty,
          grounded: q.grounded,
          stem: q.stem,
          options: q.options,
          chosenIndex,
          correctIndex: q.correctIndex,
          correct,
          explanation: q.explanation,
          recommendation,
        } as QuestionResult;
      }),
    );

    // 5. Update the attempt with the final score and submission time
    await deps.db
      .update(schema.quizAttempts)
      .set({ score: correctCount, submittedAt: new Date() })
      .where(eq(schema.quizAttempts.id, attemptId));

    // 6. Calculate user topic masteries
    const topicBreakdown = await calculateTopicMastery(deps.db, userId);

    const responsePayload: QuizResultResponse = {
      attemptId,
      score: correctCount,
      total: attempt.total,
      results: questionResults,
      topicBreakdown,
    };

    return Response.json(responsePayload);
  };
}

async function calculateTopicMastery(db: Db, userId: string): Promise<readonly TopicScore[]> {
  // Retrieve all questions answered by this user across submitted attempts
  const allAnswered = await db
    .select({
      topic: schema.quizQuestions.topic,
      correct: schema.quizQuestions.correct,
    })
    .from(schema.quizQuestions)
    .innerJoin(schema.quizAttempts, eq(schema.quizQuestions.attemptId, schema.quizAttempts.id))
    .where(
      and(
        eq(schema.quizQuestions.userId, userId),
        isNotNull(schema.quizAttempts.submittedAt),
      ),
    );

  // Group by topic
  const countsByTopic = new Map<string, { seen: number; correct: number }>();
  for (const q of allAnswered) {
    const counts = countsByTopic.get(q.topic) ?? { seen: 0, correct: 0 };
    counts.seen++;
    if (q.correct === true) {
      counts.correct++;
    }
    countsByTopic.set(q.topic, counts);
  }

  // Map each canonical topic (and any other topic encountered)
  const encounteredTopics = new Set([
    ...CANONICAL_TOPICS.map((t) => t.topic),
    ...countsByTopic.keys(),
  ]);

  const topicScores: TopicScore[] = Array.from(encounteredTopics).map((topic) => {
    const counts = countsByTopic.get(topic) ?? { seen: 0, correct: 0 };
    const label = getTopicLabel(topic);
    const mastery = (counts.correct + 1) / (counts.seen + 2); // Laplace-smoothed

    return {
      topic,
      topicLabel: label,
      seen: counts.seen,
      correct: counts.correct,
      mastery,
    };
  });

  return topicScores;
}
