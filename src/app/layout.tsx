import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

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
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#16161d' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
