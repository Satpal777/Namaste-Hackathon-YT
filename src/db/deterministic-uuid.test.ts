import { describe, expect, it } from 'vitest';
import { deterministicUuid } from './deterministic-uuid';

describe('deterministicUuid', () => {
  it('returns the same UUID for the same name across calls', () => {
    expect(deterministicUuid('ws_demo:abc:0')).toBe(deterministicUuid('ws_demo:abc:0'));
  });

  it('returns different UUIDs for different names', () => {
    expect(deterministicUuid('ws_demo:abc:0')).not.toBe(deterministicUuid('ws_demo:abc:1'));
  });

  it('produces a well-formed RFC 4122 UUID', () => {
    expect(deterministicUuid('anything')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
