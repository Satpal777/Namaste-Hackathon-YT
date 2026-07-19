import { Play } from 'lucide-react';
import type { ChatSource } from '~/chat/contract';
import { Badge } from '~/components/ui/badge';
import { Card } from '~/components/ui/card';
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area';
import { mmss } from '~/domain/format-time';

/**
 * Renders as soon as the sources frame arrives — before the first answer
 * token. Each card deep-links to the exact second on YouTube: the citation is
 * self-verifying, the visitor hears the source say it.
 */
export function SourcesPanel({ sources }: { sources: readonly ChatSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-1 mb-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Cited moments
        </span>
        <Badge variant="secondary" className="h-4.5 px-1.5 text-[0.65rem]">
          {sources.length}
        </Badge>
      </div>
      <ScrollArea className="-mx-1 px-1">
        <div className="flex gap-3 pb-2">
          {sources.map((source, i) => (
            <SourceCard key={source.n} source={source} index={i} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function SourceCard({ source, index }: { source: ChatSource; index: number }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      data-testid="source-card"
      title={`${source.videoTitle} — opens YouTube at ${mmss(source.startSeconds)}`}
      className="group w-56 shrink-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards outline-none duration-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <Card
        size="sm"
        className="h-full gap-0 rounded-3xl py-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:ring-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring"
      >
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={`https://i.ytimg.com/vi/${source.youtubeVideoId}/mqdefault.jpg`}
            alt=""
            loading="lazy"
            className="size-full bg-muted object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25">
            <span className="flex size-10 scale-75 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
          </span>
          {/* The start time is the first text in the card: e2e reads the first
              M:SS in innerText as the advertised deep-link second. */}
          <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[0.65rem] font-medium text-white tabular-nums">
            {mmss(source.startSeconds)}–{mmss(source.endSeconds)}
          </span>
          <span className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-black/70 text-[0.65rem] font-semibold text-white">
            {source.n}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <span className="line-clamp-2 text-xs leading-snug font-medium text-card-foreground">
            {source.videoTitle}
          </span>
          <span className="mt-auto text-[0.7rem] text-muted-foreground transition-colors group-hover:text-primary">
            Watch on YouTube ↗
          </span>
        </div>
      </Card>
    </a>
  );
}
