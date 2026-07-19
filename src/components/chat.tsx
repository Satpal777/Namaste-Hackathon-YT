'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowUp, Clapperboard, Info, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatSource, NamasteUIMessage } from '~/chat/contract';
import { SUGGESTED_QUESTIONS } from '~/chat/suggested-questions';
import { AssistantMarkdown } from '~/components/assistant-markdown';
import { SourcesPanel } from '~/components/sources-panel';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { Spinner } from '~/components/ui/spinner';
import { cn } from '~/lib/utils';

const NEAR_BOTTOM_PX = 160;

export function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, stop } =
    useChat<NamasteUIMessage>({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
    });
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight });
  }, [messages]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setInput('');
    void sendMessage({ text: question });
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
    );
  };

  return (
    <div data-status={status} className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          aria-live="polite"
          className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10"
        >
          {messages.length === 0 && <EmptyState onPick={ask} />}
          {messages.map((message, i) => (
            <Message
              key={message.id}
              message={message}
              streaming={status === 'streaming' && i === messages.length - 1}
            />
          ))}
          {status === 'submitted' && <RetrievalPending />}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in duration-300">
              <Info />
              <AlertDescription>
                {error.message.includes('429') ||
                error.message.toLowerCase().includes('too many')
                  ? 'Too many questions too quickly — give it a moment and try again.'
                  : 'Something went wrong answering that. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 bg-background/80 px-6 pt-4 pb-5 backdrop-blur-md">
        <form
          className="mx-auto flex max-w-3xl items-center gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about hoisting, closures, the event loop…"
            aria-label="Ask a question about the series"
            className="h-11 flex-1 rounded-full border-border/60 bg-card px-5"
          />
          {busy ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-lg"
              aria-label="Stop generating"
              onClick={() => void stop()}
              className="cursor-pointer rounded-full"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-lg"
              disabled={input.trim().length === 0}
              aria-label="Send"
              className="cursor-pointer rounded-full"
            >
              <ArrowUp />
            </Button>
          )}
        </form>
        <p className="mt-3 text-center text-xs text-muted-foreground/80">
          Every answer is grounded in the series and cites the exact second.
        </p>
      </div>
    </div>
  );
}

function messageText(message: NamasteUIMessage): string {
  return message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
}

function Message({
  message,
  streaming,
}: {
  message: NamasteUIMessage;
  streaming: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground animate-in fade-in slide-in-from-bottom-2">
        {messageText(message)}
      </div>
    );
  }
  return <AssistantMessage message={message} streaming={streaming} />;
}

function AssistantMessage({
  message,
  streaming,
}: {
  message: NamasteUIMessage;
  streaming: boolean;
}) {
  const sourcesPart = message.parts.find(
    (p): p is Extract<typeof p, { type: 'data-sources' }> =>
      p.type === 'data-sources',
  );
  const sources: readonly ChatSource[] = sourcesPart?.data ?? [];
  const text = messageText(message);

  if (!sourcesPart && !text) return <RetrievalPending />;

  if (sourcesPart && sources.length === 0) {
    return (
      <Alert className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Info className="text-primary" />
        <AlertDescription className="text-foreground">
          <AssistantMarkdown
            text={text}
            sources={sources}
            className={cn(streaming && 'streaming-caret')}
          />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex max-w-full flex-col gap-4 text-sm leading-relaxed animate-in fade-in duration-300">
      <SourcesPanel sources={sources} />
      {text ? (
        <AssistantMarkdown
          text={text}
          sources={sources}
          className={cn('text-foreground/90', streaming && 'streaming-caret')}
        />
      ) : (
        <StreamStage
          label={`Matched ${sources.length} moments — writing the answer…`}
        />
      )}
    </div>
  );
}

function RetrievalPending() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <StreamStage label="Searching the transcripts…" />
      <div className="flex gap-3 overflow-hidden py-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-56 shrink-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="mt-3 h-3 w-4/5 rounded-full" />
            <Skeleton className="mt-2 h-3 w-3/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StreamStage({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-sm">
      <Spinner className="size-4 text-primary" />
      <span className="text-shimmer font-medium">{label}</span>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <Empty className="border-none py-16">
      <EmptyHeader className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <EmptyMedia variant="icon" className="rounded-xl border border-border/60 bg-card text-primary">
          <Clapperboard />
        </EmptyMedia>
        <EmptyTitle className="text-xl tracking-tight">
          Ask about a{' '}
          <span className="font-display text-primary italic">JavaScript</span>{' '}
          concept
        </EmptyTitle>
        <EmptyDescription>
          Answers come straight from the Namaste JavaScript series — every
          claim links to the second it was said.
        </EmptyDescription>
      </EmptyHeader>
      <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <Button
            key={q}
            type="button"
            variant="outline"
            onClick={() => onPick(q)}
            className="h-auto justify-start rounded-xl border-border/60 px-4 py-2.5 text-left text-[0.8125rem] font-normal whitespace-normal text-muted-foreground animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-300 hover:text-foreground"
            style={{ animationDelay: `${150 + i * 50}ms` }}
          >
            {q}
          </Button>
        ))}
      </div>
    </Empty>
  );
}
