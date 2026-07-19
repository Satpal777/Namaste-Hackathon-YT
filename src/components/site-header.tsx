import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/button';

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 outline-none">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Play className="ml-px size-3.5 fill-current" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">
        Ask Namaste JavaScript
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Wordmark />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/how-it-works"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Button size="sm" asChild>
            <Link href="/dashboard">
              Open the app
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
