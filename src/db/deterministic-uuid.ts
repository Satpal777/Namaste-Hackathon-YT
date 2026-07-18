import { createHash } from 'node:crypto';

/**
 * Name-based UUID (v5-style, SHA-1). Seeding derives row IDs from natural keys
 * (`workspaceId:videoId:chunkIndex`), so re-running upserts the same rows
 * instead of duplicating them, and a chunk's Postgres ID is byte-for-byte its
 * Qdrant point ID.
 */
export function deterministicUuid(name: string): string {
  const hash = createHash('sha1').update(name, 'utf8').digest();
  hash[6] = (hash[6]! & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8]! & 0x3f) | 0x80; // RFC 4122 variant
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
