'use client';

import { Play, SquarePlay, MessageSquare, Award, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Chat } from '~/components/chat';
import { MasteryDashboard } from '~/components/mastery-dashboard';
import { QuizRunner } from '~/components/quiz-runner';
import { QuizResults } from '~/components/quiz-results';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import type { Difficulty, QuizQuestionPublic, QuizResultResponse } from '~/interview/contract';

export default function HomePage() {
  const [mode, setMode] = useState<'chat' | 'interview'>('chat');
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [activeAttempt, setActiveAttempt] = useState<{
    attemptId: string;
    questions: readonly QuizQuestionPublic[];
  } | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResultResponse | null>(null);

  const handleStartQuiz = async (difficulty: Difficulty) => {
    setLoadingQuiz(true);
    setQuizResult(null);
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ difficulty }),
      });
      if (!res.ok) {
        throw new Error('Failed to start quiz');
      }
      const data = (await res.json()) as {
        attemptId: string;
        questions: readonly QuizQuestionPublic[];
      };
      setActiveAttempt(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong starting the quiz');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSubmitQuiz = async (answers: readonly { questionId: string; chosenIndex: number }[]) => {
    if (!activeAttempt) return;
    setSubmittingQuiz(true);
    try {
      const res = await fetch('/api/interview/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          attemptId: activeAttempt.attemptId,
          answers,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to submit quiz');
      }
      const data = (await res.json()) as QuizResultResponse;
      setQuizResult(data);
      setActiveAttempt(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong submitting the quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleCancelQuiz = () => {
    setActiveAttempt(null);
    setQuizResult(null);
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight">
                  Ask Namaste JavaScript
                </h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  17 episodes indexed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Seasons 1 &amp; 2 — answers cite the exact second in the video.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a
              href="https://www.youtube.com/@akshaymarch7"
              target="_blank"
              rel="noreferrer"
            >
              <SquarePlay />
              <span className="hidden sm:inline">by Akshay Saini</span>
            </a>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t bg-muted/20">
          <div className="mx-auto flex max-w-3xl items-center gap-1 px-4">
            <button
              onClick={() => {
                setMode('chat');
                setActiveAttempt(null);
                setQuizResult(null);
              }}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                mode === 'chat' && !activeAttempt && !quizResult
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <MessageSquare className="size-4" />
              Chat Assistant
            </button>
            <button
              onClick={() => {
                setMode('interview');
                setActiveAttempt(null);
                setQuizResult(null);
              }}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer',
                mode === 'interview' || activeAttempt || quizResult
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Award className="size-4" />
              Interview Prep
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="min-h-0 flex-1 flex flex-col bg-background/50">
        {mode === 'chat' && <Chat />}
        {mode === 'interview' && (
          <div className="flex-1 overflow-y-auto">
            {loadingQuiz && (
              <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Generating your customized JavaScript quiz...</p>
              </div>
            )}

            {!loadingQuiz && quizResult && (
              <QuizResults result={quizResult} onRestart={handleCancelQuiz} />
            )}

            {!loadingQuiz && !quizResult && activeAttempt && (
              <QuizRunner
                attemptId={activeAttempt.attemptId}
                questions={activeAttempt.questions}
                onSubmit={handleSubmitQuiz}
                onCancel={handleCancelQuiz}
                submitting={submittingQuiz}
              />
            )}

            {!loadingQuiz && !quizResult && !activeAttempt && (
              <MasteryDashboard onStartQuiz={handleStartQuiz} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t bg-card/30">
        <p className="mx-auto max-w-3xl px-4 py-2 text-center text-[0.7rem] text-muted-foreground">
          A retrieval demo over the{' '}
          <a
            className="underline underline-offset-2 transition-colors hover:text-foreground"
            href="https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP"
            target="_blank"
            rel="noreferrer"
          >
            Namaste JavaScript
          </a>{' '}
          series by Akshay Saini. All content belongs to its creator; every
          answer links back to the source video.
        </p>
      </footer>
    </div>
  );
}
