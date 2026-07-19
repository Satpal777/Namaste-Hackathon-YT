import {
  ArrowRight,
  Clock,
  Cpu,
  Database,
  ListChecks,
  MessageSquare,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { SiteFooter } from '~/components/site-footer';
import { SiteHeader } from '~/components/site-header';

const STEPS = [
  {
    icon: Database,
    title: 'Transcription & indexing',
    body: 'Every episode of the series is transcribed and split into small, overlapping segments — each one pinned to its start and end second in the video.',
  },
  {
    icon: Cpu,
    title: 'Vector embeddings',
    body: 'Each segment is embedded into a dense vector that captures the meaning of what was said, not just the words.',
  },
  {
    icon: Search,
    title: 'Semantic retrieval',
    body: 'Your question is embedded the same way, and a similarity search pulls the handful of segments most likely to contain the answer.',
  },
  {
    icon: MessageSquare,
    title: 'Grounded synthesis',
    body: 'A language model writes the answer from those segments alone — and abstains when the series never covered the topic.',
  },
  {
    icon: Clock,
    title: 'Second-level citations',
    body: 'Every claim carries a citation that deep-links to the exact second on YouTube, so you can hear the source say it.',
  },
  {
    icon: ListChecks,
    title: 'Quiz generation',
    body: 'The same transcripts seed interview-prep quizzes, graded per topic with clips to rewatch for whatever you miss.',
  },
] as const;

export default function HowItWorks() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <SiteHeader />

      <main className="flex-1 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Under the hood
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            From nine hours of video to{' '}
            <span className="font-display text-primary italic">one cited answer</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            A retrieval pipeline sits between your question and the series.
            Six steps, no magic — every answer is traceable back to the second
            it was spoken.
          </p>

          {/* Pipeline */}
          <ol className="mt-16 flex flex-col">
            {STEPS.map((step, i) => (
              <li key={step.title} className="group relative flex gap-6 sm:gap-8">
                {/* Number column with hairline connector */}
                <div className="flex flex-col items-center">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card font-mono text-xs text-muted-foreground tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="w-px flex-1 bg-border/60" />
                  )}
                </div>
                <div className="flex flex-col pb-12 group-last:pb-0">
                  <div className="flex items-center gap-2.5 pt-2">
                    <step.icon className="size-4 text-primary" />
                    <h2 className="font-medium">{step.title}</h2>
                  </div>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* CTA */}
          <div className="mt-20 flex flex-col items-start gap-6 border-t border-border/60 pt-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                See it answer for yourself
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ask a question and click the first citation it returns.
              </p>
            </div>
            <Button size="lg" asChild className="shrink-0">
              <Link href="/dashboard">
                Open the app
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
