import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Namaste JavaScript — Ask the Series',
  description:
    'Ask questions over the Namaste JavaScript series by Akshay Saini and get answers cited to the exact second in the video.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
