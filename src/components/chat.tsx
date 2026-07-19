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

/** Within this of the bottom counts as "following along", so we keep scrolling. */
const NEAR_BOTTOM_PX = 160;

export function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, stop } =
    useChat<NamasteUIMessage>({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
    });
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === 'submitted' || status === 'streaming';

  // Follow the stream, but never yank the page back down on someone who has
  // scrolled up to re-read.
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
          className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6"
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

      <div className="border-t bg-background/80 backdrop-blur">
        <form
          className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about hoisting, promises, the this keyword…"
            aria-label="Ask a question about the series"
            className="h-11 flex-1 px-4"
          />
          {busy ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-lg"
              aria-label="Stop generating"
              onClick={() => void stop()}
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-lg"
              disabled={input.trim().length === 0}
              aria-label="Send"
            >
              <ArrowUp />
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
      <div className="ml-auto max-w-[85%] animate-in fade-in slide-in-from-bottom-2 rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm duration-300">
        {messageText(message)}
      </div>
    );
  }
  return <AssistantMessage message={message} streaming={streaming} />;
}

/**
 * The stream itself narrates progress: the sources data part is written
 * before the first answer token, so "part missing" means retrieval is still
 * running, "empty list" is a canned turn (abstention / daily cap), and
 * "sources but no text yet" means the model is writing.
 */
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
        <Info />
        <AlertDescription>
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
    <div className="max-w-full animate-in fade-in duration-300 text-sm leading-relaxed">
      <SourcesPanel sources={sources} />
      {text ? (
        <AssistantMarkdown
          text={text}
          sources={sources}
          className={cn(streaming && 'streaming-caret')}
        />
      ) : (
        <StreamStage label={`Found ${sources.length} moments — writing the answer…`} />
      )}
    </div>
  );
}

/** Shown from submit until the sources frame arrives: retrieval is running. */
function RetrievalPending() {
  return (
    <div className="flex animate-in fade-in flex-col gap-3 duration-300">
      <StreamStage label="Searching the series transcripts…" />
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-56 shrink-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards duration-500"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="mt-2 h-3 w-4/5 rounded-full" />
            <Skeleton className="mt-1.5 h-3 w-3/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StreamStage({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <Spinner className="size-4 text-primary" />
      <span className="text-shimmer font-medium">{label}</span>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <Empty className="border-none py-10">
      <EmptyHeader className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-primary/10 text-primary">
          <Clapperboard className="size-6" />
        </EmptyMedia>
        <EmptyTitle>Ask the series anything conceptual</EmptyTitle>
        <EmptyDescription>
          Every answer cites the exact moment in the video — click a timestamp
          and hear it from Akshay himself.
        </EmptyDescription>
      </EmptyHeader>
      <div className="flex max-w-xl flex-wrap justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <Button
            key={q}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPick(q)}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards h-auto whitespace-normal py-1.5 font-normal text-muted-foreground duration-500 hover:text-foreground"
            style={{ animationDelay: `${150 + i * 60}ms` }}
          >
            {q}
          </Button>
        ))}
      </div>
    </Empty>
  );
}
