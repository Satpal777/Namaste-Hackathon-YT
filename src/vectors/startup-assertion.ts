import type { VectorStore } from './vector-store';

/**
 * Mandatory boot check: the configured embedding model must match the
 * collection actually being served. A mismatched vector space produces NO
 * error at query time — Qdrant accepts every write and returns quietly
 * meaningless neighbours — so the only place to catch it is before serving.
 * It guards exactly the provider-switch scenario, at exactly the hour care
 * is lowest.
 */
export async function assertVectorSpaceMatches(
  store: VectorStore,
  embedding: {
    readonly provider: string;
    readonly model: string;
    readonly dimensions: number;
  },
): Promise<void> {
  const described = await store.describeCollection();
  if (!described) {
    throw new Error(
      `Vector collection "${store.collectionName}" does not exist. ` +
        `The configured embedding is ${embedding.provider}/${embedding.model} at ${embedding.dimensions} dimensions — ` +
        `seed that collection (pnpm seed) before serving.`,
    );
  }
  if (described.dimensions !== embedding.dimensions) {
    throw new Error(
      `Vector collection "${store.collectionName}" stores ${described.dimensions}-dimensional vectors ` +
        `but the configured embedding ${embedding.provider}/${embedding.model} produces ${embedding.dimensions}. ` +
        `Refusing to serve a mismatched vector space.`,
    );
  }
}
