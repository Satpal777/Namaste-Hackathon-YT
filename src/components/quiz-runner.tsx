'use client';

import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { QuizQuestionPublic } from '~/interview/contract';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { cn } from '~/lib/utils';

export interface QuizRunnerProps {
  readonly attemptId: string;
  readonly questions: readonly QuizQuestionPublic[];
  readonly onSubmit: (answers: readonly { questionId: string; chosenIndex: number }[]) => Promise<void>;
  readonly onCancel: () => void;
  readonly submitting: boolean;
}

export function QuizRunner({
  questions,
  onSubmit,
  onCancel,
  submitting,
}: QuizRunnerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const currentQuestion = questions[currentIdx];
  if (!currentQuestion) return null;

  const selectedIndex = selectedAnswers[currentQuestion.id];

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const isLastQuestion = currentIdx === questions.length - 1;
  const hasAnsweredCurrent = selectedIndex !== undefined;

  const handleSubmitQuiz = async () => {
    const formattedAnswers = questions.map((q) => ({
      questionId: q.id,
      chosenIndex: selectedAnswers[q.id] ?? 0,
    }));
    await onSubmit(formattedAnswers);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12 animate-in fade-in duration-300">
      {/* Progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Practice quiz
          </span>
          <span className="text-sm text-muted-foreground tabular-nums">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>
        <Progress
          value={((currentIdx + 1) / questions.length) * 100}
          className="h-1"
        />
      </div>

      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{currentQuestion.topicLabel}</Badge>
            <Badge
              variant={currentQuestion.difficulty === 'hard' ? 'destructive' : 'outline'}
              className="capitalize"
            >
              {currentQuestion.difficulty}
            </Badge>
            {currentQuestion.grounded && (
              <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-success" />
                Grounded in the transcripts
              </Badge>
            )}
          </div>
          <CardTitle className="mt-3 text-base leading-relaxed font-medium text-balance">
            {currentQuestion.stem}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-2.5">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                data-testid="quiz-option"
                onClick={() => handleSelectOption(idx)}
                disabled={submitting}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full cursor-pointer items-start gap-3.5 rounded-xl border p-4 text-left text-sm transition-colors',
                  isSelected
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/40'
                    : 'border-border/60 hover:bg-muted/40',
                  submitting && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-relaxed text-foreground/90">{option}</span>
              </button>
            );
          })}
        </CardContent>

        <CardFooter className="justify-between border-t border-border/60">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentIdx === 0 || submitting}
            className="cursor-pointer"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!hasAnsweredCurrent || submitting}
              className="cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Check data-icon="inline-start" />
                  Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!hasAnsweredCurrent || submitting}
              className="cursor-pointer"
            >
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="text-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel quiz and return to the dashboard
        </button>
      </div>
    </div>
  );
}
