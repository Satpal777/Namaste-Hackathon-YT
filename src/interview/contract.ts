/**
 * The wire contract between the interview endpoints and the UI. It mirrors the
 * chat contract's discipline: the answer key (correctIndex, explanation,
 * recommendation) is NEVER part of the start payload — it is revealed only in
 * the submit response, after the browser has committed its choices. Grading is
 * server-side; the client cannot see or forge the correct answer.
 */

export type Difficulty = 'foundational' | 'hard';

/** How many questions one quiz holds. */
export const QUIZ_LENGTH = 5;

/** A question as sent to the browser to be answered — no answer key. */
export interface QuizQuestionPublic {
  readonly id: string;
  readonly position: number;
  readonly topic: string;
  readonly topicLabel: string;
  readonly difficulty: Difficulty;
  /** False ⇒ "General practice — not from the series" badge; no source. */
  readonly grounded: boolean;
  readonly stem: string;
  readonly options: readonly string[];
}

export interface QuizStartResponse {
  readonly attemptId: string;
  readonly questions: readonly QuizQuestionPublic[];
}

export interface SubmitRequest {
  readonly attemptId: string;
  readonly answers: readonly { readonly questionId: string; readonly chosenIndex: number }[];
}

/** A timestamped clip to watch for a missed topic — same shape the chat cites. */
export interface Recommendation {
  readonly videoTitle: string;
  readonly youtubeVideoId: string;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly url: string;
}

/** Per-question outcome, revealed after submit. */
export interface QuestionResult extends QuizQuestionPublic {
  readonly chosenIndex: number | null;
  readonly correctIndex: number;
  readonly correct: boolean;
  readonly explanation: string;
  /** Present for a missed question when the series actually covers the topic. */
  readonly recommendation: Recommendation | null;
}

/** Per-topic mastery AFTER this attempt — the adaptive signal, shown to the user. */
export interface TopicScore {
  readonly topic: string;
  readonly topicLabel: string;
  readonly seen: number;
  readonly correct: number;
  /** Laplace-smoothed accuracy in [0, 1]; unseen topics read as 0.5. */
  readonly mastery: number;
}

export interface QuizResultResponse {
  readonly attemptId: string;
  readonly score: number;
  readonly total: number;
  readonly results: readonly QuestionResult[];
  readonly topicBreakdown: readonly TopicScore[];
}
