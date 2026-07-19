'use client';

import { Award, BookOpen, Brain, Play, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Difficulty, TopicScore } from '~/interview/contract';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Welcome / Performance Stats Block */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-8 md:p-10 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 size-48 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="size-4 animate-spin-slow text-amber-500" />
              <span>Namaste JavaScript Interview Engine</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
              Master Your JS Core
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Test your understanding of hoisting, scope, closures, event loop, and asynchronous JavaScript with AI-generated questions grounded directly in Akshay Saini's transcripts.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            {/* Visual Circular progress representation */}
            <div className="relative flex size-28 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-primary/10">
              <svg className="absolute size-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-muted fill-transparent"
                  strokeWidth="6"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-primary fill-transparent transition-all duration-1000 ease-out"
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - overallMastery)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-black tracking-tighter">
                  {Math.round(overallMastery * 100)}%
                </span>
                <div className="text-[0.65rem] uppercase font-bold text-muted-foreground tracking-wider">
                  Mastery
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Actions Bar */}
        <div className="relative mt-8 flex flex-col gap-4 border-t border-primary/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Total of <span className="font-semibold text-foreground">{totalQuestionsAnswered}</span> questions answered across sessions.
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Difficulty Toggle Button Group */}
            <div className="inline-flex rounded-2xl bg-muted/60 p-1.5 ring-1 ring-foreground/5 shadow-inner">
              <button
                type="button"
                onClick={() => setDifficulty('foundational')}
                className={cn(
                  'rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer',
                  difficulty === 'foundational'
                    ? 'bg-background text-foreground shadow-md ring-1 ring-foreground/5'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Foundational
              </button>
              <button
                type="button"
                onClick={() => setDifficulty('hard')}
                className={cn(
                  'rounded-xl px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer',
                  difficulty === 'hard'
                    ? 'bg-background text-foreground shadow-md ring-1 ring-foreground/5'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Hard Mode 🔥
              </button>
            </div>

            {/* Launch Quiz Action */}
            <Button
              size="lg"
              onClick={() => onStartQuiz(difficulty)}
              className="group cursor-pointer rounded-2xl font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30"
            >
              <Play className="mr-2 size-4 fill-current transition-transform group-hover:translate-x-0.5" />
              Start Practice Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <Alert variant="destructive" className="rounded-2xl border-destructive/20 shadow-md">
          <AlertCircle className="size-5" />
          <AlertTitle className="font-bold">Failed to load progress</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm">{error}</span>
            <Button variant="outline" size="sm" onClick={() => void fetchMastery()} className="w-fit">
              <RefreshCw className="mr-2 size-3.5" /> Reload Progress
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Topic Grid Header */}
      <div className="flex items-center justify-between border-b border-muted/50 pb-3">
        <div className="flex items-center gap-2.5 font-semibold text-foreground/90">
          <BookOpen className="size-5 text-primary" />
          <span className="text-lg">Topic-by-Topic Mastery</span>
        </div>
        <Badge variant="outline" className="text-xs py-0.5 px-2.5 bg-muted/40 font-medium">
          Laplace Smoothed Scoring
        </Badge>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} size="sm" className="rounded-3xl border border-muted/20 bg-muted/5">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/5 rounded-full" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pb-4">
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Topics Grid */}
      {!loading && !error && topicScores && (
        <div className="grid gap-4 sm:grid-cols-2">
          {topicScores.map((score) => {
            const percentage = Math.round(score.mastery * 100);
            return (
              <Card
                key={score.topic}
                size="sm"
                className="group relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20 border-primary/5 bg-card/30 backdrop-blur-sm rounded-3xl"
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold tracking-tight text-foreground/90 truncate group-hover:text-primary transition-colors">
                      {score.topicLabel}
                    </CardTitle>
                  </div>
                  <span className="text-sm font-extrabold text-foreground group-hover:scale-105 transition-transform shrink-0">
                    {percentage}%
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pb-5">
                  {/* Progress Line */}
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-inner ring-1 ring-foreground/5">
                    <div
                      style={{ width: `${score.mastery * 100}%` }}
                      className={cn(
                        'h-full rounded-full transition-all duration-700 ease-out shadow-sm',
                        score.mastery < 0.5
                          ? 'bg-gradient-to-r from-red-500 to-rose-500'
                          : score.mastery < 0.75
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-500',
                      )}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                    <span>
                      {score.seen === 0
                        ? 'Not attempted yet'
                        : `${score.correct} of ${score.seen} questions correct`}
                    </span>
                    {score.seen > 0 && (
                      <span className="text-[0.65rem] uppercase font-bold tracking-wider opacity-60">
                        Active Progress
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
