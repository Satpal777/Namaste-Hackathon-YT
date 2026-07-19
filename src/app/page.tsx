import { Play, SquarePlay } from 'lucide-react';
import { Chat } from '~/components/chat';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Play className="ml-0.5 size-4 fill-current" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight">
                  Ask Namaste JavaScript
                </h1>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  17 episodes indexed
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Seasons 1 &amp; 2 — answers cite the exact second in the video.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a
              href="https://www.youtube.com/@akshaymarch7"
              target="_blank"
              rel="noreferrer"
            >
              <SquarePlay />
              <span className="hidden sm:inline">by Akshay Saini</span>
            </a>
          </Button>
        </div>
      </header>

      <Chat />

      <footer className="border-t">
        <p className="mx-auto max-w-3xl px-4 py-2 text-center text-[0.7rem] text-muted-foreground">
          A retrieval demo over the{' '}
          <a
            className="underline underline-offset-2 transition-colors hover:text-foreground"
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
