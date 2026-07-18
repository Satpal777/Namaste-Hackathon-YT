import { describe, expect, it } from 'vitest';
import { collectionNameFor } from './collection-name';

describe('collectionNameFor', () => {
  it('derives the name from the embedding model and dimensions', () => {
    expect(
      collectionNameFor({ model: 'gemini-embedding-001', dimensions: 3072 }),
    ).toBe('njs_chunks_gemini_embedding_001_3072');
    expect(
      collectionNameFor({ model: 'text-embedding-3-small', dimensions: 1536 }),
    ).toBe('njs_chunks_text_embedding_3_small_1536');
  });

  it('gives a same-dimension model swap a different collection, so the boot assertion catches it', () => {
    const a = collectionNameFor({ model: 'text-embedding-3-small', dimensions: 1536 });
    const b = collectionNameFor({ model: 'some-other-model', dimensions: 1536 });
    expect(a).not.toBe(b);
  });
});
