import { defineConfig } from 'vitest/config';

// Correctness tests only. The Playwright suite in e2e/ has its own runner and
// its own config — vitest must never pick those specs up.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
