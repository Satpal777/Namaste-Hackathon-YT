import { ExternalLink } from 'lucide-react';
import type { ChatSource } from '~/chat/contract';

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Renders as soon as the sources frame arrives — before the first answer
 * token. Each card deep-links to the exact second on YouTube: the citation is
 * self-verifying, the visitor hears the source say it.
 */
export function SourcesPanel({ sources }: { sources: readonly ChatSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-1 mb-2 flex gap-2 overflow-x-auto pb-1">
      {sources.map((source) => (
        <a
          key={source.n}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group flex min-w-52 max-w-64 shrink-0 flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary"
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <span className="flex size-4 items-center justify-center rounded-full bg-primary/10">
              {source.n}
            </span>
            {mmss(source.startSeconds)}–{mmss(source.endSeconds)}
            <ExternalLink className="ml-auto size-3 opacity-50 group-hover:opacity-100" />
          </span>
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {source.videoTitle}
          </span>
        </a>
      ))}
    </div>
  );
}
