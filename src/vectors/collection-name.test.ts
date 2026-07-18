import { describe, expect, it } from 'vitest';
import { collectionNameFor } from './collection-name';

describe('collectionNameFor', () => {
  it('derives the name from provider and dimensions', () => {
    expect(
      collectionNameFor({ provider: 'gemini', dimensions: 3072 }),
    ).toBe('njs_chunks_gemini_3072');
    expect(
      collectionNameFor({ provider: 'openai', dimensions: 1536 }),
    ).toBe('njs_chunks_openai_1536');
  });
});
