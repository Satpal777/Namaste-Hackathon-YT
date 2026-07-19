import { eq, and, isNotNull } from 'drizzle-orm';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import type { TopicScore } from './contract';

export const CANONICAL_TOPICS = [
  { topic: 'hoisting', label: 'Hoisting' },
  { topic: 'closures', label: 'Closures' },
  { topic: 'undefined-not-defined', label: 'Undefined vs Not Defined' },
  { topic: 'promises', label: 'Promises & Callbacks' },
  { topic: 'async-await', label: 'Async/Await' },
  { topic: 'this-keyword', label: 'This Behavior' },
  { topic: 'scope', label: 'Scope & Lexical Environment' },
  { topic: 'event-loop', label: 'Event Loop' },
];

export function getTopicLabel(topic: string): string {
  const match = CANONICAL_TOPICS.find((t) => t.topic === topic);
  if (match) return match.label;
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function calculateTopicMastery(db: Db, userId: string): Promise<readonly TopicScore[]> {
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
