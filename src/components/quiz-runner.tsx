'use client';

import { ArrowLeft, ArrowRight, Award, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { QuizQuestionPublic } from '~/interview/contract';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
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
      chosenIndex: selectedAnswers[q.id] ?? 0, // Fallback if somehow unanswered, though UI enforces it
    }));
    await onSubmit(formattedAnswers);
  };

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12 animate-in fade-in zoom-in-95 duration-300">
      {/* Progress Card */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Award className="size-4 text-primary" />
            <span>Practice Attempt</span>
          </span>
          <span>
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted shadow-inner">
          <div
            style={{ width: `${progressPercentage}%` }}
            className="h-full rounded-full bg-primary transition-all duration-300"
          />
        </div>
      </div>

      {/* Main Question Card */}
      <Card className="border-primary/10 shadow-lg bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-primary/5 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-semibold uppercase tracking-wider text-[0.65rem]">
              {currentQuestion.topicLabel}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'font-medium text-[0.65rem] border-primary/20',
                currentQuestion.difficulty === 'hard' && 'bg-destructive/5 text-destructive border-destructive/20',
              )}
            >
              {currentQuestion.difficulty === 'hard' ? 'Hard Mode' : 'Foundational'}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'font-medium text-[0.65rem] border-primary/20',
                currentQuestion.grounded
                  ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {currentQuestion.grounded ? 'Namaste JS Grounded' : 'General Practice'}
            </Badge>
          </div>
          <CardTitle className="text-base font-semibold leading-relaxed mt-2 text-foreground/90">
            {currentQuestion.stem}
          </CardTitle>
        </CardHeader>

        {/* Options list */}
        <CardContent className="py-6 flex flex-col gap-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={submitting}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border bg-card/60 p-4 text-left text-sm transition-all duration-200 cursor-pointer shadow-sm',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-md shadow-primary/5 font-medium'
                    : 'border-muted-foreground/10 hover:border-primary/20 hover:bg-primary/5/10 hover:shadow-md',
                  submitting && 'opacity-60 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-bold transition-all',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{option}</span>
              </button>
            );
          })}
        </CardContent>

        {/* Footer actions */}
        <CardFooter className="flex items-center justify-between border-t border-primary/5 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={currentIdx === 0 || submitting}
            className="cursor-pointer"
          >
            <ArrowLeft className="mr-1.5 size-4" /> Back
          </Button>

          {isLastQuestion ? (
            <Button
              size="sm"
              onClick={handleSubmitQuiz}
              disabled={!hasAnsweredCurrent || submitting}
              className="shadow-md shadow-primary/10 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-1.5 size-4" /> Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!hasAnsweredCurrent || submitting}
              className="cursor-pointer"
            >
              Next <ArrowRight className="ml-1.5 size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Cancel quiz */}
      <div className="text-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <HelpCircle className="size-3.5" />
          Cancel and return to dashboard
        </button>
      </div>
    </div>
  );
}
