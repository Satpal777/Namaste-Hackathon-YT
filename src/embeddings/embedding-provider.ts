/**
 * One of the four product seams. Chat is a commodity; embeddings are not —
 * Google's OpenAI-compatibility layer drops `dimensions` and `task_type`, so
 * embeddings get their own interface rather than sharing chat's baseURL swap.
 *
 * Documents and queries embed differently on purpose: Gemini's task_type
 * asymmetry (RETRIEVAL_DOCUMENT vs RETRIEVAL_QUERY) is only reachable when the
 * call sites are distinct.
 */
export interface EmbeddingProvider {
  /** e.g. 'gemini'. Collection names derive from this — never configured apart. */
  readonly provider: string;
  /** e.g. 'gemini-embedding-001'. */
  readonly model: string;
  /** e.g. 3072. A mismatch here is a silent wrong-neighbours bug, not an error. */
  readonly dimensions: number;
  embedDocuments(texts: readonly string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}
