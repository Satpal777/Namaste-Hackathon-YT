'use client';

import { ArrowLeft, ArrowRight, Award, CheckCircle, HelpCircle, Loader2, Compass } from 'lucide-react';
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
      chosenIndex: selectedAnswers[q.id] ?? 0,
    }));
    await onSubmit(formattedAnswers);
  };

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12 animate-in fade-in zoom-in-95 duration-300">
      {/* Progress Header Area */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Compass className="size-4 text-primary animate-pulse" />
            <span>Active Practice Quiz</span>
          </span>
          <span>
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-inner ring-1 ring-foreground/5">
          <div
            style={{ width: `${progressPercentage}%` }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 shadow-sm"
          />
        </div>
      </div>

      {/* Main Question Card with Breathable Space */}
      <Card className="border-primary/10 shadow-xl bg-card/45 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 border-b border-primary/5 p-8 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2.5">
            <Badge variant="secondary" className="font-extrabold uppercase tracking-widest text-[0.65rem] px-2.5 py-0.5">
              {currentQuestion.topicLabel}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'font-bold text-[0.65rem] border-primary/10 px-2.5 py-0.5',
                currentQuestion.difficulty === 'hard' && 'bg-destructive/5 text-destructive border-destructive/20',
              )}
            >
              {currentQuestion.difficulty === 'hard' ? 'Hard Mode' : 'Foundational'}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'font-bold text-[0.65rem] border-primary/10 px-2.5 py-0.5',
                currentQuestion.grounded
                  ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {currentQuestion.grounded ? 'Grounded in Akshay\'s Transcripts' : 'General Theory'}
            </Badge>
          </div>
          <CardTitle className="text-lg font-bold leading-relaxed mt-2 text-foreground/95">
            {currentQuestion.stem}
          </CardTitle>
        </CardHeader>

        {/* Options List with Breathable Space */}
        <CardContent className="p-8 flex flex-col gap-3.5 bg-muted/5">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={submitting}
                className={cn(
                  'flex w-full items-start gap-4 rounded-2xl border bg-card/75 p-5 text-left text-sm transition-all duration-300 cursor-pointer shadow-sm relative group/btn',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-md shadow-primary/5 font-semibold text-primary-foreground/90'
                    : 'border-muted/60 hover:border-primary/25 hover:bg-primary/5/5 hover:shadow-md',
                  submitting && 'opacity-65 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-all duration-300',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 text-muted-foreground group-hover/btn:border-primary group-hover/btn:text-primary',
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-relaxed text-foreground/90 group-hover/btn:text-foreground transition-colors">
                  {option}
                </span>
              </button>
            );
          })}
        </CardContent>

        {/* Card Actions Footer */}
        <CardFooter className="flex items-center justify-between border-t border-primary/5 p-6 bg-card/10">
          <Button
            variant="outline"
            size="default"
            onClick={handleBack}
            disabled={currentIdx === 0 || submitting}
            className="cursor-pointer rounded-xl font-bold"
          >
            <ArrowLeft className="mr-2 size-4" /> Back
          </Button>

          {isLastQuestion ? (
            <Button
              size="default"
              onClick={handleSubmitQuiz}
              disabled={!hasAnsweredCurrent || submitting}
              className="shadow-md shadow-primary/10 cursor-pointer rounded-xl font-bold transition-all hover:scale-[1.02]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Submitting answers...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 size-4" /> Finish and Submit
                </>
              )}
            </Button>
          ) : (
            <Button
              size="default"
              onClick={handleNext}
              disabled={!hasAnsweredCurrent || submitting}
              className="cursor-pointer rounded-xl font-bold"
            >
              Next Question <ArrowRight className="ml-2 size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Navigation Cancellation */}
      <div className="text-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-semibold uppercase tracking-wider"
        >
          <HelpCircle className="size-4" />
          Cancel Quiz and return to dashboard
        </button>
      </div>
    </div>
  );
}
