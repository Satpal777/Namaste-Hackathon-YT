import Link from 'next/link';
import { Separator } from '~/components/ui/separator';
import { Wordmark } from '~/components/site-header';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Wordmark />
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <a
              href="https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              The series ↗
            </a>
          </nav>
        </div>
        <Separator className="bg-border/60" />
        <div className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            Unofficial, non-commercial hackathon project built for educational
            demonstration. All course material, videos, and transcripts belong to{' '}
            <a
              href="https://www.youtube.com/@akshaymarch7"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              Akshay Saini
            </a>
            .
          </p>
          <p>No personal data or search queries are stored by this application.</p>
        </div>
      </div>
    </footer>
  );
}
