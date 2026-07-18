import ReactMarkdown from 'react-markdown';
import type { ChatSource } from '~/chat/contract';
import { linkifyCitations } from '~/chat/linkify-citations';

/**
 * Assistant prose with `[n]` markers resolved against the source list the
 * client already holds — the sources arrived before this text started.
 */
export function AssistantMarkdown({
  text,
  sources,
}: {
  text: string;
  sources: readonly ChatSource[];
}) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        components={{
          a: ({ href, children, ...props }) => {
            const citation = href?.match(/^#source-(\d+)$/);
            if (citation) {
              const source = sources[Number(citation[1]) - 1];
              if (!source) return <>{children}</>;
              return (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${source.videoTitle} — opens YouTube at the cited moment`}
                  className="mx-0.5 inline-flex size-4.5 -translate-y-0.5 items-center justify-center rounded-full bg-primary/10 align-middle text-[0.65rem] font-semibold text-primary no-underline hover:bg-primary/20"
                >
                  {citation[1]}
                </a>
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
