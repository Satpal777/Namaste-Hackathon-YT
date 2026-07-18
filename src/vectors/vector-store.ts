/**
 * Thin payload on purpose — identifiers and filter fields only. This is a
 * correctness decision, not a performance one: text and titles hydrate from
 * Postgres by ID after search, so a vector whose row was deleted CANNOT be
 * served. The no-leakage guarantee rests on a join, not on flawless retries.
 */
export interface ChunkPointPayload {
  readonly workspaceId: string;
  readonly videoId: string;
  readonly chunkId: string;
}

export interface VectorPoint {
  /** The chunk's deterministic UUID — same value as its Postgres row ID. */
  readonly id: string;
  readonly vector: readonly number[];
  readonly payload: ChunkPointPayload;
}

export interface VectorMatch {
  readonly chunkId: string;
  readonly score: number;
}

/**
 * The Qdrant boundary, one of the four product seams. Postgres is the source
 * of truth; this is only an index over it.
 */
export interface VectorStore {
  /** The collection this store reads and writes — derived, never configured. */
  readonly collectionName: string;
  /** Create the collection and its tenant payload index if absent. */
  ensureCollection(): Promise<void>;
  /** For the startup assertion: the live collection's config, if it exists. */
  describeCollection(): Promise<{ dimensions: number } | undefined>;
  upsert(points: readonly VectorPoint[]): Promise<void>;
  search(
    vector: readonly number[],
    options: { readonly workspaceId: string; readonly limit: number },
  ): Promise<VectorMatch[]>;
}
