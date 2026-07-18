import { describe, expect, it } from 'vitest';
import type { VectorStore } from './vector-store';
import { assertVectorSpaceMatches } from './startup-assertion';

function fakeStore(described: { dimensions: number } | undefined): VectorStore {
  return {
    collectionName: 'njs_chunks_gemini_3072',
    describeCollection: async () => described,
    ensureCollection: async () => {},
    upsert: async () => {},
    search: async () => [],
  };
}

const embedding = { provider: 'gemini', model: 'gemini-embedding-001', dimensions: 3072 };

describe('assertVectorSpaceMatches', () => {
  it('passes when the collection exists with the configured dimensions', async () => {
    await expect(
      assertVectorSpaceMatches(fakeStore({ dimensions: 3072 }), embedding),
    ).resolves.toBeUndefined();
  });

  it('fails the boot when the collection does not exist', async () => {
    await expect(
      assertVectorSpaceMatches(fakeStore(undefined), embedding),
    ).rejects.toThrow(/njs_chunks_gemini_3072.*does not exist/s);
  });

  it('fails the boot on a dimension mismatch instead of serving wrong neighbours', async () => {
    await expect(
      assertVectorSpaceMatches(fakeStore({ dimensions: 1536 }), embedding),
    ).rejects.toThrow(/1536.*3072|3072.*1536/s);
  });
});
