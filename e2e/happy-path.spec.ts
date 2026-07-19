import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * The money path against the real deployed demo (#14): ask a question, watch
 * the answer stream, see the sources arrive, and confirm the timestamp deep
 * link carries the exact video and second. This gates submission.
 *
 * Plumbing only — deliberately no assertion about whether retrieval is GOOD.
 * Quality is Stage 2's eval set; conflating the two is how e2e suites go
 * flaky and get ignored.
 */

// The deployed corpus is seeded from this repo's transcript cache, so any
// cited video must be one of the cached episodes.
const corpusVideoIds = new Set(
  readdirSync(
    fileURLToPath(new URL('../corpus/transcripts', import.meta.url)),
  ).map((file) => file.replace(/\.json$/, '')),
);

const QUESTION = 'What is hoisting in JavaScript?';

test('ask a suggested question, watch it stream, land on the cited second', async ({
  page,
}) => {
  await page.goto('/dashboard');

  // Landing state: conceptual suggested questions before anything is typed.
  const suggestion = page.getByRole('button', { name: QUESTION });
  await expect(suggestion).toBeVisible();
  await suggestion.click();

  // The answer arrives as a stream: the client must pass through its
  // streaming state, not jump straight to a finished blob. The first chunk
  // can sit behind a cold start — the instance boots, asserts the vector
  // space, embeds the query — so be generous.
  await expect(page.locator('[data-status="streaming"]')).toBeVisible({
    timeout: 45_000,
  });

  // Sources arrive with the stream (the contract writes them before the
  // first answer token). An abstention ships no sources, so this also fails —
  // correctly gating submission — if the demo declined the question.
  const card = page.getByTestId('source-card').first();
  await expect(card).toBeVisible({ timeout: 15_000 });

  // The stream finishes and has produced a non-empty answer.
  await expect(page.locator('[data-status="ready"]')).toBeVisible({
    timeout: 60_000,
  });
  const answer = page.getByTestId('assistant-answer').first();
  expect((await answer.innerText()).trim().length).toBeGreaterThan(0);

  // The timestamp deep link resolves to the expected video and second. The
  // video must be one the corpus actually contains, and t= must equal the
  // start time the card VISIBLY advertises ("M:SS", floored whole seconds) —
  // the ground truth a visitor compares against.
  const href = await card.getAttribute('href');
  expect(href).toBeTruthy();
  const url = new URL(href!);
  expect(url.hostname).toMatch(/(^|\.)youtube\.com$/);

  const videoId = url.searchParams.get('v');
  expect(videoId, 'deep link has no v= video id').toBeTruthy();
  expect(
    corpusVideoIds.has(videoId!),
    `cited video ${videoId} is not in the seeded corpus`,
  ).toBe(true);
 
  const visibleStart = (await card.innerText()).match(/(\d+):(\d{2})/);
  expect(visibleStart, 'card shows no M:SS start time').not.toBeNull();
  const expectedSeconds =
    Number(visibleStart![1]) * 60 + Number(visibleStart![2]);
  expect(url.searchParams.get('t')).toBe(`${expectedSeconds}s`);
});

test('quiz happy path: navigate, start, answer, submit, review results', async ({ page }) => {
  await page.goto('/dashboard');

  // 1. Switch to "Interview Prep" mode
  const tab = page.getByRole('button', { name: /Interview Prep/i });
  await expect(tab).toBeVisible();
  await tab.click();

  // 2. Mastery Dashboard loads
  const header = page.getByText(/JavaScript Interview Prep/i);
  await expect(header).toBeVisible();

  // 3. Click "Start Quiz"
  const startBtn = page.getByRole('button', { name: /Start Quiz/i });
  await expect(startBtn).toBeVisible();
  await startBtn.click();

  // 4. Verify Quiz Runner loads
  await expect(page.getByText(/Question 1 of 5/i)).toBeVisible({ timeout: 15_000 });

  // 5. Answer all 5 questions
  for (let i = 1; i <= 5; i++) {
    // Check progress text
    await expect(page.getByText(`Question ${i} of 5`)).toBeVisible();

    // Select the first option (Option A)
    const optionA = page.getByTestId('quiz-option').first();
    await expect(optionA).toBeVisible();
    await optionA.click();

    // Click "Next" (or "Submit Quiz" on the last question)
    if (i < 5) {
      const nextBtn = page.getByRole('button', { name: /Next/i });
      await expect(nextBtn).toBeVisible();
      await nextBtn.click();
    } else {
      const submitBtn = page.getByRole('button', { name: /Submit Quiz/i });
      await expect(submitBtn).toBeVisible();
      await submitBtn.click();
    }
  }

  // 6. Verify Quiz Results view
  await expect(page.getByText(/Practice Complete/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Overall JavaScript Mastery/i)).toBeVisible();
  await expect(page.getByText(/Question-by-Question Review/i)).toBeVisible();
});
