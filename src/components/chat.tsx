'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowUp, Clapperboard, Info, Square, Sparkles, Send } from 'lucide-react';
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
    <div data-status={status} className="flex min-h-0 flex-1 flex-col bg-background/30">
      {/* Scrollable messages container with spacing */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          aria-live="polite"
          className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8"
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
            <Alert variant="destructive" className="animate-in fade-in duration-300 rounded-2xl shadow-md border-destructive/20">
              <Info className="size-5" />
              <AlertDescription className="text-sm font-medium">
                {error.message.includes('429') ||
                error.message.toLowerCase().includes('too many')
                  ? 'Too many questions too quickly — give it a moment and try again.'
                  : 'Something went wrong answering that. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Floating Chat Input bar redone with breathable glassmorphism styling */}
      <div className="border-t border-muted/50 bg-background/85 backdrop-blur-md px-6 py-5 shadow-inner">
        <form
          className="mx-auto flex max-w-3xl items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <div className="relative flex-1 flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hoisting, promises, closures, scope, this behavior..."
              aria-label="Ask a question about the series"
              className="h-12 w-full pl-5 pr-12 rounded-2xl border-muted bg-card shadow-sm hover:border-primary/20 focus-visible:ring-primary/20 text-sm leading-relaxed"
            />
            <Sparkles className="absolute right-4 size-4 text-muted-foreground/50 pointer-events-none" />
          </div>
          {busy ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Stop generating"
              onClick={() => void stop()}
              className="size-12 rounded-2xl shrink-0 cursor-pointer hover:bg-muted/90 shadow-sm"
            >
              <Square className="size-4 fill-current text-foreground/80" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={input.trim().length === 0}
              aria-label="Send"
              className="size-12 rounded-2xl shrink-0 cursor-pointer shadow-md shadow-primary/10 transition-transform active:scale-95"
            >
              <Send className="size-4" />
            </Button>
          )}
        </form>
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
      <div className="ml-auto max-w-[80%] animate-in fade-in slide-in-from-bottom-3 rounded-3xl rounded-br-lg bg-primary px-5 py-3.5 text-sm text-primary-foreground shadow-md leading-relaxed">
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
      <Alert className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-3xl border-primary/10 bg-card/30 backdrop-blur-sm p-5 shadow-sm">
        <Info className="size-5 text-primary" />
        <AlertDescription className="text-sm leading-relaxed text-foreground">
          <AssistantMarkdown
            text={text}
            sources={sources}
            className={cn('text-foreground', streaming && 'streaming-caret')}
          />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-full animate-in fade-in duration-300 text-sm leading-relaxed flex flex-col gap-4">
      <SourcesPanel sources={sources} />
      {text ? (
        <div className="bg-card/25 rounded-3xl p-5 border border-primary/5 shadow-sm">
          <AssistantMarkdown
            text={text}
            sources={sources}
            className={cn(streaming && 'streaming-caret', 'leading-relaxed text-foreground/90')}
          />
        </div>
      ) : (
        <StreamStage label={`Matched ${sources.length} video citations — generating answer...`} />
      )}
    </div>
  );
}

function RetrievalPending() {
  return (
    <div className="flex animate-in fade-in flex-col gap-4 duration-300">
      <StreamStage label="Searching transcripts for relevant clips..." />
      <div className="flex gap-4 overflow-hidden py-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-60 shrink-0 animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-500"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <Skeleton className="aspect-video w-full rounded-2xl border border-muted/30" />
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
    <div className="flex items-center gap-2.5 py-1 text-sm font-semibold text-primary/80">
      <Spinner className="size-4 text-primary" />
      <span className="text-shimmer font-semibold">{label}</span>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <Empty className="border-none py-12">
      <EmptyHeader className="animate-in fade-in slide-in-from-bottom-3 duration-500 flex flex-col items-center text-center max-w-xl gap-4">
        <EmptyMedia variant="icon" className="size-16 rounded-2xl bg-primary/10 text-primary shadow-inner">
          <Clapperboard className="size-7" />
        </EmptyMedia>
        <EmptyTitle className="text-2xl font-extrabold tracking-tight">Ask about JavaScript concepts</EmptyTitle>
        <EmptyDescription className="text-sm leading-relaxed text-muted-foreground mt-1">
          Every response links directly to the exact timestamp in the Namaste JavaScript series.
          Click a citation card and hear Akshay Saini explain it!
        </EmptyDescription>
      </EmptyHeader>
      <div className="flex max-w-2xl flex-wrap justify-center gap-2.5 mt-8 px-4">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <Button
            key={q}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPick(q)}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards h-auto whitespace-normal rounded-2xl px-4 py-2 font-semibold text-xs text-muted-foreground/80 hover:text-foreground transition-all duration-300 hover:shadow-md border-muted/50"
            style={{ animationDelay: `${150 + i * 60}ms` }}
          >
            {q}
          </Button>
        ))}
      </div>
    </Empty>
  );
}
