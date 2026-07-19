import { ArrowRight, Clock, ListChecks, MessagesSquare, Play } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { SiteFooter } from '~/components/site-footer';
import { SiteHeader } from '~/components/site-header';

const FEATURES = [
  {
    icon: MessagesSquare,
    title: 'Grounded chat',
    body: 'Ask about hoisting, closures, or the event loop. Answers come only from the series transcripts, with inline citations you can verify.',
  },
  {
    icon: Clock,
    title: 'Second-level deep links',
    body: 'Every citation opens YouTube at the exact second it was said — the source explains it in Akshay’s own words.',
  },
  {
    icon: ListChecks,
    title: 'Interview prep quizzes',
    body: 'Five-question rounds graded topic by topic, with clips to rewatch for everything you missed.',
  },
] as const;

const TOPICS = [
  'Execution context',
  'Hoisting',
  'Call stack',
  'Scope chain',
  'Closures',
  'let & const',
  'Block scope',
  'Callbacks',
  'Event loop',
  'Higher-order functions',
  'map, filter & reduce',
  'Promises',
  'async / await',
  'this keyword',
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-24 pb-24 sm:pt-32">
          <div aria-hidden className="bg-dot-grid absolute inset-0" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Built on Akshay Saini&apos;s Namaste JavaScript
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
              Ask anything about JavaScript.{' '}
              <span className="font-display text-primary italic">
                Hear the answer
              </span>{' '}
              from the source.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A chat assistant over the Namaste JavaScript series. Every claim
              links to the exact second of the exact video — click a citation
              and the source says it out loud.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Start asking
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>

            {/* Product preview — a frozen frame of the real chat flow. */}
            <div
              aria-hidden
              className="mt-20 w-full max-w-2xl text-left select-none"
            >
              <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-xl shadow-foreground/[0.04] sm:p-8">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  Why are closures still alive after the outer function returns?
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Cited moments
                    </span>
                    <Badge variant="secondary" className="h-4.5 px-1.5 text-[0.65rem]">
                      2
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs">
                      <Play className="size-3 fill-current text-primary" />
                      <span className="font-medium">Closures in JS</span>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        06:12
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs">
                      <Play className="size-3 fill-current text-primary" />
                      <span className="font-medium">Famous Interview Questions</span>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        14:05
                      </span>
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    A closure is a function bundled together with its lexical
                    environment{' '}
                    <span className="inline-flex size-4.5 -translate-y-0.5 items-center justify-center rounded-full bg-primary/10 align-middle text-[0.65rem] font-semibold text-primary">
                      1
                    </span>{' '}
                    — so even after the outer function returns, the inner
                    function keeps a live reference to those variables, not a
                    copy{' '}
                    <span className="inline-flex size-4.5 -translate-y-0.5 items-center justify-center rounded-full bg-primary/10 align-middle text-[0.65rem] font-semibold text-primary">
                      2
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stat strip */}
            <div className="mt-16 grid w-full max-w-2xl grid-cols-3 divide-x divide-border/60 border-y border-border/60">
              <div className="flex flex-col items-center gap-1 py-6">
                <span className="text-2xl font-semibold tracking-tight">17</span>
                <span className="text-xs text-muted-foreground">
                  episodes indexed
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 py-6">
                <span className="text-2xl font-semibold tracking-tight">1s</span>
                <span className="text-xs text-muted-foreground">
                  citation precision
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 py-6">
                <span className="text-2xl font-semibold tracking-tight">2</span>
                <span className="text-xs text-muted-foreground">
                  quiz difficulty modes
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/60 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              What&apos;s inside
            </p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-balance">
              Three ways into a{' '}
              <span className="font-display italic">nine-hour</span> series
            </h2>
            <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex flex-col">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-card text-primary">
                    <feature.icon className="size-4.5" />
                  </span>
                  <h3 className="mt-5 font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Syllabus */}
        <section className="border-t border-border/60 px-6 py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Coverage
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              The whole syllabus, searchable
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Every episode is transcribed, segmented, and embedded — ask about
              any of these and get the moment it was taught.
            </p>
            <div className="mt-10 flex max-w-2xl flex-wrap justify-center gap-2.5">
              {TOPICS.map((topic) => (
                <Badge
                  key={topic}
                  variant="outline"
                  className="h-8 rounded-full border-border/60 px-4 text-[0.8125rem] text-muted-foreground"
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border/60 px-6 py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Stop scrubbing videos.{' '}
              <span className="font-display text-primary italic">Start asking.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No sign-up. Open the app, ask a question, click a citation.
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href="/dashboard">
                Open the app
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
