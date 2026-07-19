'use client';

import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { QuizResultResponse } from '~/interview/contract';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface QuizResultsProps {
  readonly result: QuizResultResponse;
  readonly onRestart: () => void;
}

export function QuizResults({ result, onRestart }: QuizResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const scorePercentage = (result.score / result.total) * 100;

  let title = 'Worth another look';
  let message = 'Review the missed topics below — each one links to the clip that covers it.';
  if (result.score === result.total) {
    title = 'A perfect round';
    message = 'Every answer correct. Try hard mode for a sterner test.';
  } else if (scorePercentage >= 80) {
    title = 'Excellent work';
    message = 'A solid grasp of these concepts — one clip below is worth a rewatch.';
  } else if (scorePercentage >= 60) {
    title = 'On the right track';
    message = 'A few gaps to close. The recommended clips below cover what you missed.';
  }

  const recommendations = result.results.flatMap((q) => (q.recommendation ? [q.recommendation] : []));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-6 py-12 animate-in fade-in duration-500">
      {/* Summary */}
      <section className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div className="flex max-w-md flex-col gap-3">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Practice Complete
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground/80">
            Your overall JavaScript mastery updates with every attempt.
          </p>
          <Button onClick={onRestart} className="mt-3 w-fit cursor-pointer">
            <RotateCcw data-icon="inline-start" />
            Try another quiz
          </Button>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1 sm:items-end">
          <div className="font-display text-7xl tracking-tight tabular-nums">
            {result.score}
            <span className="text-muted-foreground/60">/{result.total}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(scorePercentage)}% correct
          </span>
        </div>
      </section>

      {/* Recommended clips */}
      {recommendations.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-medium">Clips worth rewatching</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendations.map((rec, i) => (
              <a
                key={i}
                href={rec.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-3 rounded-xl border border-border/60 p-4 transition-colors hover:border-success/40 hover:bg-success/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Play className="size-3.5 fill-current" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground/50 transition-colors group-hover:text-success" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="line-clamp-2 text-sm leading-snug font-medium">
                    {rec.videoTitle}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    from {Math.floor(rec.startSeconds / 60)}:
                    {String(Math.floor(rec.startSeconds % 60)).padStart(2, '0')}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Review */}
      <section className="flex flex-col gap-4">
        <h2 className="font-medium">Question-by-Question Review</h2>
        <div className="divide-y divide-border/60 rounded-2xl border border-border/60">
          {result.results.map((q) => {
            const isExpanded = !!expandedQuestions[q.id];
            return (
              <div key={q.id}>
                <button
                  type="button"
                  onClick={() => toggleExpand(q.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full cursor-pointer items-center gap-4 p-4 text-left transition-colors hover:bg-muted/40 sm:px-5"
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full',
                      q.correct
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {q.correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground/90">
                    {q.stem}
                  </span>
                  <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
                    {q.topicLabel}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      isExpanded && 'rotate-180',
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="flex flex-col gap-5 border-t border-border/60 bg-muted/20 p-5 animate-in fade-in duration-200 sm:p-6">
                    <p className="text-sm leading-relaxed font-medium">{q.stem}</p>

                    <div className="flex flex-col gap-2">
                      {q.options.map((option, idx) => {
                        const isChosen = q.chosenIndex === idx;
                        const isCorrect = q.correctIndex === idx;
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-start gap-3 rounded-xl border p-3.5 text-sm leading-relaxed',
                              isCorrect
                                ? 'border-success/40 bg-success/5'
                                : isChosen
                                  ? 'border-destructive/40 bg-destructive/5'
                                  : 'border-border/60 bg-background/50 text-muted-foreground',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-semibold',
                                isCorrect
                                  ? 'bg-success text-success-foreground'
                                  : isChosen
                                    ? 'bg-destructive text-white'
                                    : 'border border-border text-muted-foreground',
                              )}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-1.5 border-l-2 border-primary/40 pl-4 text-sm">
                      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Explanation
                      </span>
                      <p className="leading-relaxed text-foreground/90">{q.explanation}</p>
                    </div>

                    {q.recommendation && (
                      <a
                        href={q.recommendation.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-success/40 hover:bg-success/5 hover:text-success"
                      >
                        <Play className="size-3 fill-current" />
                        Rewatch this in the series
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
