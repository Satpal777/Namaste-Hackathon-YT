'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChatSource, NamasteUIMessage } from '~/chat/contract';
import { SUGGESTED_QUESTIONS } from '~/chat/suggested-questions';
import { cn } from '~/lib/utils';
import { AssistantMarkdown } from './assistant-markdown';
import { SourcesPanel } from './sources-panel';

/** Within this of the bottom counts as "following along", so we keep scrolling. */
const NEAR_BOTTOM_PX = 160;

export function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat<NamasteUIMessage>({
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
          className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6"
        >
          {messages.length === 0 && <EmptyState onPick={ask} />}
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {status === 'submitted' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching the series…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-400/40 bg-red-500/5 px-4 py-3 text-sm text-red-500">
              {error.message.includes('429') || error.message.toLowerCase().includes('too many')
                ? 'Too many questions too quickly — give it a moment and try again.'
                : 'Something went wrong answering that. Please try again.'}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about hoisting, promises, the this keyword…"
            aria-label="Ask a question about the series"
            className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary sm:text-sm"
          />
          <button
            type="submit"
            disabled={busy || input.trim().length === 0}
            aria-label="Send"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function messageText(message: NamasteUIMessage): string {
  return message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');
}

function Message({ message }: { message: NamasteUIMessage }) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {messageText(message)}
      </div>
    );
  }

  const sources: readonly ChatSource[] =
    message.parts.find(
      (p): p is Extract<typeof p, { type: 'data-sources' }> =>
        p.type === 'data-sources',
    )?.data ?? [];
  const text = messageText(message);

  return (
    <div className="max-w-full text-sm leading-relaxed">
      <SourcesPanel sources={sources} />
      <AssistantMarkdown text={text} sources={sources} />
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-4 py-8 text-center">
      <div>
        <h2 className="text-lg font-medium">Ask the series anything conceptual</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every answer cites the exact moment in the video — click a timestamp
          and hear it from Akshay himself.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className={cn(
              'rounded-full border border-border bg-card px-4 py-2 text-sm',
              'text-muted-foreground transition-colors hover:border-primary hover:text-foreground',
            )}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
