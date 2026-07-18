/**
 * Collection names are derived, never configured separately — a configured
 * name can drift from the model actually used, and a drifted name means
 * queries embed into a different vector space than the stored points, which
 * returns quietly meaningless neighbours rather than an error.
 */
export function collectionNameFor(embedding: {
  readonly provider: string;
  readonly dimensions: number;
}): string {
  return `njs_chunks_${embedding.provider}_${embedding.dimensions}`;
}
