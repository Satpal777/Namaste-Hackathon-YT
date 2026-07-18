/**
 * Collection names are derived from model + dimensions, never configured
 * separately — a configured name can drift from the model actually used, and a
 * drifted name means queries embed into a different vector space than the
 * stored points, which returns quietly meaningless neighbours rather than an
 * error.
 *
 * The name IS the record of which embedding filled the collection: any model
 * or dimension change — including a same-dimension model swap — lands on a
 * different (absent) collection and fails the startup assertion instead of
 * serving garbage.
 */
export function collectionNameFor(embedding: {
  readonly model: string;
  readonly dimensions: number;
}): string {
  const model = embedding.model.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `njs_chunks_${model}_${embedding.dimensions}`;
}
