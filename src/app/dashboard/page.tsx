'use client';

import { Play, SquarePlay, MessageSquare, Award, Loader2, Star, Home } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Chat } from '~/components/chat';
import { MasteryDashboard } from '~/components/mastery-dashboard';
import { QuizRunner } from '~/components/quiz-runner';
import { QuizResults } from '~/components/quiz-results';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
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

  return (
    <div className="flex h-dvh flex-col bg-background antialiased selection:bg-primary/20">
      {/* Floating / Glassmorphic Header */}
      <header className="sticky top-0 z-50 border-b border-muted/50 bg-background/85 backdrop-blur-md px-6 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-primary-foreground shadow-md shadow-primary/10">
              <Play className="ml-0.5 size-4.5 fill-current" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-foreground">
                  Ask Namaste JavaScript
                </h1>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[0.65rem] font-bold px-2 py-0">
                  <Star className="mr-1 size-3 text-amber-500 fill-current" />
                  17 Videos Indexed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Ask questions or run interview prep quizzes citing exact timestamps.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="shrink-0 rounded-xl font-bold cursor-pointer">
              <Link href="/">
                <Home className="size-4 mr-1" />
                Home
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="shrink-0 rounded-xl font-bold border-muted hover:border-primary/25 cursor-pointer shadow-sm">
              <a
                href="https://www.youtube.com/@akshaymarch7"
                target="_blank"
                rel="noreferrer"
              >
                <SquarePlay className="size-4" />
                <span className="hidden sm:inline">by Akshay Saini</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Header Navigation Tabs */}
        <div className="border-t border-muted/30">
          <div className="mx-auto flex max-w-4xl items-center gap-2">
            <button
              onClick={() => {
                setMode('chat');
                setActiveAttempt(null);
                setQuizResult(null);
              }}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition-all cursor-pointer relative',
                mode === 'chat' && !activeAttempt && !quizResult
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <MessageSquare className="size-4" />
              Chat Assistant
              {mode === 'chat' && !activeAttempt && !quizResult && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-pulse" />
              )}
            </button>
            <button
              onClick={() => {
                setMode('interview');
                setActiveAttempt(null);
                setQuizResult(null);
              }}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 py-3 px-5 text-sm font-bold transition-all cursor-pointer relative',
                mode === 'interview' || activeAttempt || quizResult
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Award className="size-4" />
              Interview Prep
              {(mode === 'interview' || activeAttempt || quizResult) && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-h-0 flex-1 flex flex-col bg-muted/10 overflow-hidden">
        {mode === 'chat' && <Chat />}
        {mode === 'interview' && (
          <div className="flex-1 overflow-y-auto">
            {loadingQuiz && (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center px-6 animate-in fade-in duration-300">
                <Loader2 className="size-10 animate-spin text-primary" />
                <h3 className="text-lg font-bold text-foreground mt-2">Customizing Practice Questions</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Synthesizing JavaScript concepts into practice multiple choice questions...
                </p>
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

      {/* Footer */}
      {/* <footer className="border-t border-muted/50 bg-card/45 px-6 py-4 text-center text-[0.7rem] text-muted-foreground leading-relaxed">
        <div className="mx-auto max-w-4xl flex flex-col gap-1.5 items-center justify-center">
          <p className="font-semibold text-foreground">
            Retrieval engine over the{' '}
            <a
              className="underline underline-offset-2 transition-colors hover:text-primary font-bold"
              href="https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP"
              target="_blank"
              rel="noreferrer"
            >
              Namaste JavaScript
            </a>{' '}
            series by Akshay Saini.
          </p>
          <p className="text-[0.65rem] text-muted-foreground/80 max-w-2xl">
            Disclaimer: Unofficial, non-commercial hackathon project built for educational demonstration. All content owned by Akshay Saini. Privacy: No personal user logs or search queries are stored.
          </p>
        </div>
      </footer> */}
    </div>
  );
}
