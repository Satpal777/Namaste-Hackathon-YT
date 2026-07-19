'use client';

import { Award, BookOpen, Brain, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Difficulty, TopicScore } from '~/interview/contract';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { cn } from '~/lib/utils';

export interface MasteryDashboardProps {
  readonly onStartQuiz: (difficulty: Difficulty) => void;
}

export function MasteryDashboard({ onStartQuiz }: MasteryDashboardProps) {
  const [topicScores, setTopicScores] = useState<readonly TopicScore[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('foundational');

  const fetchMastery = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/interview/mastery');
      if (!res.ok) {
        throw new Error('Failed to load mastery data');
      }
      const data = (await res.json()) as { topicScores: readonly TopicScore[] };
      setTopicScores(data.topicScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMastery();
  }, []);

  const overallMastery =
    topicScores && topicScores.length > 0
      ? topicScores.reduce((acc, curr) => acc + curr.mastery, 0) / topicScores.length
      : 0.5;

  const totalQuestionsAnswered =
    topicScores?.reduce((acc, curr) => acc + curr.seen, 0) ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 animate-in fade-in duration-300">
      {/* Intro & Overview Hero Card */}
      <Card className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-background backdrop-blur-sm">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 size-32 rounded-full bg-primary/5 blur-3xl" />
        <CardHeader className="relative">
          <div className="flex items-center gap-2 text-primary">
            <Brain className="size-5" />
            <span className="text-xs font-semibold tracking-wider uppercase">Namaste JS Prep</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight mt-1">
            JavaScript Interview Prep
          </CardTitle>
          <CardDescription>
            Test your understanding of hoisting, closures, event loop, and async JS using questions generated directly from Akshay Saini's transcripts.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-t border-primary/5 pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Award className="size-8" />
              <div className="absolute inset-0 rounded-2xl border border-primary/20 animate-pulse" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight">
                {Math.round(overallMastery * 100)}%
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Overall JavaScript Mastery
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Difficulty Selector */}
            <div className="inline-flex rounded-xl bg-muted p-1 text-sm shadow-inner">
              <button
                type="button"
                onClick={() => setDifficulty('foundational')}
                className={cn(
                  'rounded-lg px-3 py-1 font-medium transition-all cursor-pointer',
                  difficulty === 'foundational'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Foundational
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('hard')}
                className={cn(
                  'rounded-lg px-3 py-1 font-medium transition-all cursor-pointer',
                  difficulty === 'hard'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Hard Mode 🔥
              </button>
            </div>

            {/* Start Quiz Action */}
            <Button
              size="default"
              onClick={() => onStartQuiz(difficulty)}
              className="group shadow-md shadow-primary/20 cursor-pointer"
            >
              <Play className="mr-2 size-4 fill-current transition-transform group-hover:scale-110" />
              Start Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to load progress</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void fetchMastery()}>
              <RefreshCw className="mr-2 size-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Mastery Topic Grid Header */}
      <div className="flex items-center justify-between mt-2 border-b pb-2">
        <div className="flex items-center gap-2 font-medium">
          <BookOpen className="size-4 text-muted-foreground" />
          <span>Topic Mastery Breakdown</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {totalQuestionsAnswered} practice questions seen
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} size="sm">
              <CardHeader className="pb-1">
                <Skeleton className="h-5 w-2/3" />
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mastery Topic Grid */}
      {!loading && !error && topicScores && (
        <div className="grid gap-3 sm:grid-cols-2">
          {topicScores.map((score) => {
            const percentage = Math.round(score.mastery * 100);
            return (
              <Card
                key={score.topic}
                size="sm"
                className="transition-all hover:-translate-y-0.5 hover:shadow-md border-primary/5 hover:border-primary/10 bg-card/40 backdrop-blur-sm"
              >
                <CardHeader className="pb-1 flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-sm font-semibold truncate">
                    {score.topicLabel}
                  </CardTitle>
                  <span className="text-xs font-bold text-muted-foreground">
                    {percentage}%
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {/* Progress bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                    <div
                      style={{ width: `${score.mastery * 100}%` }}
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        score.mastery < 0.5
                          ? 'bg-destructive/70'
                          : score.mastery < 0.75
                            ? 'bg-amber-500/70'
                            : 'bg-emerald-500/70',
                      )}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[0.7rem] text-muted-foreground">
                    <span>
                      {score.seen === 0
                        ? 'Unseen'
                        : `${score.correct} / ${score.seen} correct`}
                    </span>
                    {score.seen > 0 && (
                      <span className="font-semibold text-foreground/75">
                        Laplace Mastery
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
