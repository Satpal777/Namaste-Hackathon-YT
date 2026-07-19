'use client';

import {
  Award,
  Check,
  X,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import type { QuizResultResponse } from '~/interview/contract';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
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

  // Grade-dependent motivational messages
  let title = 'Needs Review';
  let message = 'Keep studying Akshay\'s videos to strengthen your understanding.';
  if (result.score === result.total) {
    title = 'Perfect Score! 🌟';
    message = 'Incredible! You have complete mastery of these JavaScript concepts.';
  } else if (scorePercentage >= 80) {
    title = 'Excellent Work! 🎉';
    message = 'Great job! You have a solid grasp of these core concepts.';
  } else if (scorePercentage >= 60) {
    title = 'Good Effort';
    message = 'You are on the right track. Review the missed topics to improve.';
  }

  const recommendations = result.results.flatMap((q) => (q.recommendation ? [q.recommendation] : []));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 animate-in fade-in duration-300">
      {/* Score Hero Summary Card */}
      <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-transparent to-background backdrop-blur-sm shadow-lg">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 size-32 rounded-full bg-primary/5 blur-3xl" />
        <CardHeader className="text-center sm:text-left">
          <div className="flex justify-center sm:justify-start items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Award className="size-4 animate-bounce" />
            <span>Practice Complete</span>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 max-w-lg">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-t border-primary/10 pt-6">
          <div className="flex items-center justify-center sm:justify-start gap-5">
            {/* Circular score display */}
            <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
              <span className="text-2xl font-black">{result.score}</span>
              <span className="text-muted-foreground text-sm font-medium">/{result.total}</span>
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-foreground">
                Score: {Math.round(scorePercentage)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {result.total - result.score} questions missed
              </div>
            </div>
          </div>

          <Button
            size="default"
            onClick={onRestart}
            className="shadow-md shadow-primary/20 cursor-pointer w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 size-4" /> Try Another Quiz
          </Button>
        </CardContent>
      </Card>

      {/* Recommended Clips to watch if there are any */}
      {recommendations.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
            <Play className="size-4 fill-current animate-pulse text-emerald-600" />
            <span>Recommended Clips to Watch</span>
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendations.map((rec, i) => (
              <a
                key={i}
                href={rec.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-left transition-all hover:bg-emerald-500/10 hover:shadow-md hover:border-emerald-500/40"
              >
                <div className="flex items-start justify-between gap-3 text-emerald-700 dark:text-emerald-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Citation Match
                  </span>
                  <ExternalLink className="size-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">
                  {rec.videoTitle}
                </h4>
                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[0.65rem] px-2 py-0">
                    Jump to {Math.floor(rec.startSeconds / 60)}:
                    {String(Math.floor(rec.startSeconds % 60)).padStart(2, '0')}
                  </Badge>
                  <span>Hear Akshay explain it</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Question Details Review */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <BookOpen className="size-4" />
          <span>Question-by-Question Review</span>
        </h3>
        <div className="flex flex-col gap-4">
          {result.results.map((q) => {
            const isExpanded = !!expandedQuestions[q.id];
            return (
              <Card
                key={q.id}
                size="sm"
                className={cn(
                  'border-primary/5 transition-all overflow-hidden bg-card/30 backdrop-blur-sm',
                  q.correct
                    ? 'hover:border-emerald-500/20 shadow-emerald-500/5'
                    : 'border-destructive/10 hover:border-destructive/20 shadow-destructive/5',
                )}
              >
                {/* Header/Summary */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="flex items-center justify-between gap-4 p-4 cursor-pointer select-none hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm',
                        q.correct ? 'bg-emerald-500' : 'bg-destructive',
                      )}
                    >
                      {q.correct ? <Check className="size-4" /> : <X className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <Badge variant="secondary" className="text-[0.65rem] uppercase font-semibold">
                          {q.topicLabel}
                        </Badge>
                        <Badge variant="outline" className="text-[0.65rem] border-primary/10">
                          {q.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold truncate leading-relaxed text-foreground/80 max-w-lg sm:max-w-xl">
                        {q.stem}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 size-8 p-0 cursor-pointer">
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </Button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-primary/5 bg-muted/5 p-4 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm font-semibold mb-4 leading-relaxed text-foreground">
                      {q.stem}
                    </p>

                    {/* Options */}
                    <div className="flex flex-col gap-2.5 mb-4">
                      {q.options.map((option, idx) => {
                        const isChosen = q.chosenIndex === idx;
                        const isCorrect = q.correctIndex === idx;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-start gap-3 rounded-xl border p-3.5 text-sm leading-snug',
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 font-medium'
                                : isChosen
                                  ? 'border-destructive bg-destructive/5 text-destructive font-medium'
                                  : 'border-muted-foreground/10 bg-card/45 opacity-80',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-black',
                                isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : isChosen
                                    ? 'bg-destructive text-white'
                                    : 'border border-muted-foreground/30 text-muted-foreground',
                              )}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm leading-relaxed">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-primary mb-1">
                        Explanation
                      </h4>
                      <p className="text-foreground/90">{q.explanation}</p>
                    </div>

                    {/* Video Deep Link Card in Expansion */}
                    {q.recommendation && (
                      <div className="mt-3">
                        <a
                          href={q.recommendation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:shadow transition-all cursor-pointer"
                        >
                          <Play className="size-3.5 fill-current" />
                          <span>Review in Namaste JS (Ep. jump to video)</span>
                          <ArrowRight className="size-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
