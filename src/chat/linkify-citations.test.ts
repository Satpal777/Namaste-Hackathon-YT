import { describe, expect, it } from 'vitest';
import { linkifyCitations } from './linkify-citations';

describe('linkifyCitations', () => {
  it('links markers that correspond to a real source', () => {
    expect(linkifyCitations('Closures capture scope [1].', 2)).toBe(
      'Closures capture scope [1](#source-1).',
    );
  });

  it('leaves markers alone when the number has no source', () => {
    expect(linkifyCitations('Made up [7].', 2)).toBe('Made up [7].');
  });

  it('never rewrites inside inline code or fenced blocks', () => {
    expect(linkifyCitations('Use `arr[1]` here [1].', 3)).toBe(
      'Use `arr[1]` here [1](#source-1).',
    );
    const fenced = 'Look:\n```js\nconst x = arr[1];\n```\nSee [1].';
    expect(linkifyCitations(fenced, 3)).toBe(
      'Look:\n```js\nconst x = arr[1];\n```\nSee [1](#source-1).',
    );
  });

  it('treats a streaming, still-open code fence as code', () => {
    const streaming = 'As shown [1]:\n```js\nconst first = items[1';
    expect(linkifyCitations(streaming, 3)).toBe(
      'As shown [1](#source-1):\n```js\nconst first = items[1',
    );
  });
});
