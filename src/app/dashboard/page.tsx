'use client';

import { ListChecks, MessagesSquare, SquarePlay } from 'lucide-react';
import { useState } from 'react';
import { Chat } from '~/components/chat';
import { MasteryDashboard } from '~/components/mastery-dashboard';
import { QuizRunner } from '~/components/quiz-runner';
import { QuizResults } from '~/components/quiz-results';
import { Wordmark } from '~/components/site-header';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import { cn } from '~/lib/utils';
import type { Difficulty, QuizQuestionPublic, QuizResultResponse } from '~/interview/contract';

export default function DashboardPage() {
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

  const switchMode = (next: 'chat' | 'interview') => {
    setMode(next);
    setActiveAttempt(null);
    setQuizResult(null);
  };

  return (
    <div className="flex h-dvh flex-col bg-background antialiased selection:bg-primary/20">
      <header className="z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto] items-center gap-3 px-4 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
          <div className="hidden sm:block">
            <Wordmark />
          </div>

          {/* Mode switcher */}
          <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1">
            <ModeTab
              active={mode === 'chat'}
              onClick={() => switchMode('chat')}
              icon={<MessagesSquare className="size-4" />}
              label="Chat"
            />
            <ModeTab
              active={mode === 'interview'}
              onClick={() => switchMode('interview')}
              icon={<ListChecks className="size-4" />}
              label="Interview Prep"
            />
          </div>

          <div className="flex items-center justify-end">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <a
                href="https://www.youtube.com/@akshaymarch7"
                target="_blank"
                rel="noreferrer"
              >
                <SquarePlay data-icon="inline-start" />
                <span className="hidden md:inline">by Akshay Saini</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {mode === 'chat' && <Chat />}
        {mode === 'interview' && (
          <div className="flex-1 overflow-y-auto">
            {loadingQuiz && (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center animate-in fade-in duration-300">
                <Spinner className="size-6 text-primary" />
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-medium text-foreground">
                    Preparing your questions
                  </h2>
                  <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                    Drafting five questions from the series transcripts…
                  </p>
                </div>
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
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
