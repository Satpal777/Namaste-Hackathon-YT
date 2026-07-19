'use client';

import { AlertCircle, Play, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Difficulty, TopicScore } from '~/interview/contract';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Progress } from '~/components/ui/progress';
import { Skeleton } from '~/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';

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
        throw new Error('Failed to load mastery progress');
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-6 py-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Hero */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex max-w-md flex-col gap-3">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Practice mode
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              JavaScript Interview Prep
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Five questions per round, drafted from the series transcripts and
              graded topic by topic. Your mastery updates with every attempt.
            </p>
          </div>

          {/* Overall mastery ring */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="relative flex size-28 items-center justify-center">
              <svg className="absolute size-28 -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  className="fill-transparent stroke-muted"
                  strokeWidth="5"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  className="fill-transparent stroke-primary transition-all duration-1000 ease-out"
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - overallMastery)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {Math.round(overallMastery * 100)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">overall mastery</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">
              {totalQuestionsAnswered}
            </span>{' '}
            questions answered so far
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={difficulty}
              onValueChange={(value) => {
                if (value) setDifficulty(value as Difficulty);
              }}
            >
              <ToggleGroupItem value="foundational" className="cursor-pointer">
                Foundational
              </ToggleGroupItem>
              <ToggleGroupItem value="hard" className="cursor-pointer">
                Hard
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => onStartQuiz(difficulty)} className="cursor-pointer">
              <Play data-icon="inline-start" className="fill-current" />
              Start Quiz
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Failed to load progress</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void fetchMastery()} className="w-fit cursor-pointer">
              <RefreshCw data-icon="inline-start" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Topic mastery */}
      {!error && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-medium">Mastery by topic</h2>
            <span className="text-xs text-muted-foreground">Laplace-smoothed</span>
          </div>

          <div className="divide-y divide-border/60 rounded-2xl border border-border/60">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3 px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <Skeleton className="h-4 w-40 rounded-full" />
                    <Skeleton className="h-4 w-10 rounded-full" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}

            {!loading &&
              topicScores?.map((score) => {
                const percentage = Math.round(score.mastery * 100);
                return (
                  <div key={score.topic} className="flex flex-col gap-2.5 px-5 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex min-w-0 items-baseline gap-2.5">
                        <span className="truncate text-sm font-medium">
                          {score.topicLabel}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {score.seen === 0
                            ? 'not attempted'
                            : `${score.correct}/${score.seen} correct`}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-sm tabular-nums">
                        {percentage}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
