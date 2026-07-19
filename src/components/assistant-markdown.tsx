import ReactMarkdown from 'react-markdown';
import type { ChatSource } from '~/chat/contract';
import { linkifyCitations } from '~/chat/linkify-citations';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { mmss } from '~/domain/format-time';
import { cn } from '~/lib/utils';

/**
 * Assistant prose with `[n]` markers resolved against the source list the
 * client already holds — the sources arrived before this text started.
 */
export function AssistantMarkdown({
  text,
  sources,
  className,
}: {
  text: string;
  sources: readonly ChatSource[];
  className?: string;
}) {
  return (
    <div
      data-testid="assistant-answer"
      className={cn('prose-chat', className)}
    >
      <ReactMarkdown
        components={{
          a: ({ href, children, ...props }) => {
            const citation = href?.match(/^#source-(\d+)$/);
            if (citation) {
              const source = sources[Number(citation[1]) - 1];
              if (!source) return <>{children}</>;
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mx-0.5 inline-flex size-4.5 -translate-y-0.5 items-center justify-center rounded-full bg-primary/10 align-middle text-[0.65rem] font-semibold text-primary no-underline transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {citation[1]}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {source.videoTitle} · {mmss(source.startSeconds)} — opens
                    YouTube at the cited moment
                  </TooltipContent>
                </Tooltip>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {linkifyCitations(text, sources.length)}
      </ReactMarkdown>
    </div>
  );
}
