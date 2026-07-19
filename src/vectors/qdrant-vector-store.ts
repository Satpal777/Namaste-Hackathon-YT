import { QdrantClient } from '@qdrant/js-client-rest';
import type { VectorMatch, VectorPoint, VectorStore } from './vector-store';

export class QdrantVectorStore implements VectorStore {
  readonly collectionName: string;
  readonly #client: QdrantClient;
  readonly #dimensions: number;

  constructor(options: {
    readonly url: string;
    readonly apiKey?: string;
    readonly collectionName: string;
    readonly dimensions: number;
  }) {
    this.#client = new QdrantClient({ url: options.url, apiKey: options.apiKey });
    this.collectionName = options.collectionName;
    this.#dimensions = options.dimensions;
  }

  async ensureCollection(): Promise<void> {
    const { exists } = await this.#client.collectionExists(this.collectionName);
    if (exists) return;
    await this.#client.createCollection(this.collectionName, {
      vectors: { size: this.#dimensions, distance: 'Cosine' },
    });
    // One collection for all tenants; is_tenant co-locates each workspace's
    // points on disk.
    await this.#client.createPayloadIndex(this.collectionName, {
      field_name: 'workspaceId',
      field_schema: { type: 'keyword', is_tenant: true },
    });
  }

  /**
   * Which of these point IDs already exist — a seeding concern (resume without
   * re-embedding, sparing embed quota), so it lives on the class, not the
   * VectorStore product seam.
   */
  async existingIds(ids: readonly string[]): Promise<Set<string>> {
    const points = await this.#client.retrieve(this.collectionName, {
      ids: [...ids],
      with_payload: false,
      with_vector: false,
    });
    return new Set(points.map((p) => String(p.id)));
  }

  async describeCollection(): Promise<{ dimensions: number } | undefined> {
    const { exists } = await this.#client.collectionExists(this.collectionName);
    if (!exists) return undefined;
    const info = await this.#client.getCollection(this.collectionName);
    const vectors = info.config.params.vectors;
    const size = typeof vectors === 'object' && vectors !== null && 'size' in vectors
      ? Number(vectors.size)
      : Number.NaN;
    return { dimensions: size };
  }

  async upsert(points: readonly VectorPoint[]): Promise<void> {
    await this.#client.upsert(this.collectionName, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: [...p.vector],
        payload: { ...p.payload },
      })),
    });
  }

  async search(
    vector: readonly number[],
    options: { readonly workspaceId: string; readonly limit: number },
  ): Promise<VectorMatch[]> {
    const results = await this.#client.search(this.collectionName, {
      vector: [...vector],
      limit: options.limit,
      filter: {
        must: [{ key: 'workspaceId', match: { value: options.workspaceId } }],
      },
      with_payload: true,
    });
    return results.map((r) => ({
      chunkId: String((r.payload as { chunkId?: string } | null)?.chunkId ?? r.id),
      score: r.score,
    }));
  }
}
