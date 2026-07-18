import { describe, expect, it } from 'vitest';
import type { ChannelVideo } from '../domain/video';
import { selectNamasteJavaScriptSeries } from './select-series';

function video(videoId: string, title: string): ChannelVideo {
  return { videoId, title, durationSeconds: 600, publishedText: '5 years ago' };
}

// Representative titles from the real channel: the series across both seasons,
// the adjacent Namaste React course, and the vlog/career content that would
// make the corpus heterogeneous.
const channel: ChannelVideo[] = [
  video('ep1', 'How JavaScript Works 🔥& Execution Context | Namaste JavaScript Ep.1'),
  video('ep3', 'Hoisting in JavaScript (variables & functions) | Namaste JavaScript Ep. 3'),
  video('s2e1', 'Callback Hell | Ep 01 Season 02 - Namaste JavaScript'),
  video('ep11', 'setTimeout + Closures Interview Question 🔥 | Namaste 🙏 JavaScript Ep. 11'),
  video('ep12', 'CRAZY JS INTERVIEW 🤯ft. Closures | Namaste 🙏 JavaScript Ep. 12'),
  video('react', 'Learn React JS from Scratch 🔥 Namaste React Course'),
  video('vlog', 'A Day in the Life of a Software Engineer in Bangalore'),
  video('career', 'How I cracked my dream job | My Journey'),
  video('interview', 'JavaScript Interview Questions you MUST know'),
];

describe('selectNamasteJavaScriptSeries', () => {
  const selected = selectNamasteJavaScriptSeries(channel);
  const ids = selected.map((v) => v.videoId);

  it('keeps the Namaste JavaScript series across both seasons', () => {
    expect(ids).toContain('ep1');
    expect(ids).toContain('ep3');
    expect(ids).toContain('s2e1');
  });

  it('matches titles with emoji between the series words, like "Namaste 🙏 JavaScript"', () => {
    expect(ids).toContain('ep11');
    expect(ids).toContain('ep12');
  });

  it('excludes Namaste React — broader topic space, no deeper', () => {
    expect(ids).not.toContain('react');
  });

  it('excludes vlogs, career content, and interviews — even JavaScript-titled ones', () => {
    expect(ids).not.toContain('vlog');
    expect(ids).not.toContain('career');
    expect(ids).not.toContain('interview');
  });
});
