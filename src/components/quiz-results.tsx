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
  Clapperboard,
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-10 animate-in fade-in duration-500">
      {/* Score Summary Card with glowing details */}
      <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-8 md:p-10 shadow-xl rounded-3xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 size-48 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <CardHeader className="text-center sm:text-left pb-6 border-b border-primary/5">
          <div className="flex justify-center sm:justify-start items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
            <Award className="size-4 animate-bounce" />
            <span>Practice Session Finished</span>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-2 text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2 max-w-xl leading-relaxed">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pt-6 bg-card/10">
          <div className="flex items-center justify-center sm:justify-start gap-6">
            {/* Visual Ring indicator for final score */}
            <div className="relative flex size-24 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-inner">
              <span className="text-3xl font-black">{result.score}</span>
              <span className="text-muted-foreground text-sm font-semibold">/{result.total}</span>
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-15" />
            </div>
            <div className="text-left flex flex-col gap-1">
              <div className="text-lg font-extrabold text-foreground">
                Score: {Math.round(scorePercentage)}%
              </div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {result.total - result.score} questions missed
              </div>
            </div>
          </div>

          <Button
            size="lg"
            onClick={onRestart}
            className="shadow-lg shadow-primary/20 cursor-pointer rounded-2xl font-bold transition-all hover:scale-[1.02]"
          >
            <RotateCcw className="mr-2 size-4" /> Try Another Quiz
          </Button>
        </CardContent>
      </Card>

      {/* Recommended Clips visual section */}
      {recommendations.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-black text-primary flex items-center gap-2 uppercase tracking-widest">
            <Clapperboard className="size-4 text-emerald-600 animate-pulse" />
            <span>Recommended Clip Citations for Missed Questions</span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {recommendations.map((rec, i) => (
              <a
                key={i}
                href={rec.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-left transition-all duration-300 hover:bg-emerald-500/10 hover:shadow-lg hover:border-emerald-500/40 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3 text-emerald-700 dark:text-emerald-400">
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest">
                    Recommended Watching
                  </span>
                  <ExternalLink className="size-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">
                  {rec.videoTitle}
                </h4>
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[0.65rem] px-2.5 py-0.5 font-bold">
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

      {/* Accordion Questions List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
          <BookOpen className="size-4" />
          <span>Question-by-Question Grading Review</span>
        </h3>
        <div className="flex flex-col gap-3.5">
          {result.results.map((q) => {
            const isExpanded = !!expandedQuestions[q.id];
            return (
              <Card
                key={q.id}
                size="sm"
                className={cn(
                  'border-primary/5 transition-all duration-300 overflow-hidden bg-card/30 backdrop-blur-sm rounded-3xl',
                  q.correct
                    ? 'hover:border-emerald-500/25 shadow-sm shadow-emerald-500/5'
                    : 'border-destructive/10 hover:border-destructive/25 shadow-sm shadow-destructive/5',
                )}
              >
                {/* Grading header click toggle */}
                <div
                  onClick={() => toggleExpand(q.id)}
                  className="flex items-center justify-between gap-5 p-5 cursor-pointer select-none hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full text-white shadow-md font-bold',
                        q.correct ? 'bg-emerald-500' : 'bg-destructive',
                      )}
                    >
                      {q.correct ? <Check className="size-4" /> : <X className="size-4" />}
                    </span>
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[0.65rem] uppercase font-bold px-2 py-0.5">
                          {q.topicLabel}
                        </Badge>
                        <Badge variant="outline" className="text-[0.65rem] border-primary/10 px-2 py-0.5">
                          {q.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold truncate leading-relaxed text-foreground/80 max-w-lg sm:max-w-2xl mt-1">
                        {q.stem}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 size-8 p-0 cursor-pointer rounded-full">
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </Button>
                </div>

                {/* Graded review content details expanded */}
                {isExpanded && (
                  <div className="border-t border-primary/5 bg-muted/5 p-6 animate-in slide-in-from-top-3 duration-300">
                    <p className="text-sm font-bold mb-5 leading-relaxed text-foreground/90">
                      {q.stem}
                    </p>

                    {/* Choice cards feedback */}
                    <div className="flex flex-col gap-3 mb-5">
                      {q.options.map((option, idx) => {
                        const isChosen = q.chosenIndex === idx;
                        const isCorrect = q.correctIndex === idx;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-start gap-4 rounded-2xl border p-4 text-sm leading-relaxed transition-all duration-200',
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 font-bold'
                                : isChosen
                                  ? 'border-destructive bg-destructive/5 text-destructive font-bold'
                                  : 'border-muted/50 bg-card/45 opacity-80',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-5.5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-black shadow-sm',
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

                    {/* Explanatory text block */}
                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5 text-sm leading-relaxed">
                      <h4 className="font-extrabold text-xs uppercase tracking-widest text-primary mb-2">
                        Explanation
                      </h4>
                      <p className="text-foreground/90 leading-relaxed">{q.explanation}</p>
                    </div>

                    {/* Link to source video clip recommendation */}
                    {q.recommendation && (
                      <div className="mt-4">
                        <a
                          href={q.recommendation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer"
                        >
                          <Play className="size-4 fill-current text-emerald-600" />
                          <span>Review in Namaste JS (Jump to clip section)</span>
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
