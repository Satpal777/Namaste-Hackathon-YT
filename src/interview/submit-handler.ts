import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { youtubeDeepLink } from '../chat/contract';
import { calculateTopicMastery, getTopicLabel } from './mastery';
import type {
  QuizResultResponse,
  QuestionResult,
  SubmitRequest,
  Recommendation,
} from './contract';

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

export interface SubmitHandlerDeps {
  readonly db: Db;
}
