import { defineConfig, devices } from '@playwright/test';

/**
 * The deployed demo's happy path — the suite that gates submission. It runs
 * against a REAL deployed URL, never a local server, and never shares a runner
 * with the vitest correctness suite: a red here means the deployment is
 * broken, not that a fake drifted.
 *
 *   PLAYWRIGHT_BASE_URL=https://<deployment> pnpm test:e2e
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL;
if (!baseURL) {
  throw new Error(
    'PLAYWRIGHT_BASE_URL is not set. This suite gates submission and runs ' +
      'only against a real deployment: PLAYWRIGHT_BASE_URL=https://<deployment> pnpm test:e2e',
  );
}

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Judges will open it on a phone.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
