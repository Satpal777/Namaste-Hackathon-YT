import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Inter, Instrument_Serif } from 'next/font/google';
import { TooltipProvider } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
});

/**
 * The preset themes via a `.dark` class; the app has no toggle, so mirror the
 * OS preference before first paint (and keep following it live).
 */
const followSystemTheme = `
(function () {
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var apply = function () {
    document.documentElement.classList.toggle('dark', media.matches);
  };
  apply();
  media.addEventListener('change', apply);
})();
`;

export const metadata: Metadata = {
  title: 'Namaste JavaScript — Ask the Series',
  description:
    'Ask questions over the Namaste JavaScript series by Akshay Saini and get answers cited to the exact second in the video.',
  openGraph: {
    title: 'Ask Namaste JavaScript',
    description:
      'Chat over the Namaste JavaScript series — every answer links to the exact second in the video, so you can hear the source say it.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn('font-sans', inter.variable, instrumentSerif.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <script dangerouslySetInnerHTML={{ __html: followSystemTheme }} />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
