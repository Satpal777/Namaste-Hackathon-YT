import { Play } from 'lucide-react';
import { Chat } from '~/components/chat';

export default function HomePage() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              Ask Namaste JavaScript
            </h1>
            <p className="text-xs text-muted-foreground">
              Chat over the 17 English-captioned episodes of Seasons 1 &amp; 2 —
              answers cite the exact second in the video.
            </p>
          </div>
          <a
            href="https://www.youtube.com/@akshaymarch7"
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Play className="size-3.5" />
            by Akshay Saini
          </a>
        </div>
      </header>

      <Chat />

      <footer className="border-t border-border">
        <p className="mx-auto max-w-3xl px-4 py-2 text-center text-[0.7rem] text-muted-foreground">
          A retrieval demo over the{' '}
          <a
            className="underline underline-offset-2"
            href="https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP"
            target="_blank"
            rel="noreferrer"
          >
            Namaste JavaScript
          </a>{' '}
          series by Akshay Saini. All content belongs to its creator; every
          answer links back to the source video.
        </p>
      </footer>
    </div>
  );
}
