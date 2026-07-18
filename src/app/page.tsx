export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Ask Namaste JavaScript
      </h1>
      <p className="text-muted-foreground">
        Chat over the{' '}
        <a
          className="underline underline-offset-4"
          href="https://www.youtube.com/@akshaymarch7"
        >
          Namaste JavaScript
        </a>{' '}
        series by Akshay Saini, with every answer cited to the exact second in
        the video. Coming together now — the corpus is being indexed.
      </p>
    </main>
  );
}
