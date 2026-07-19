/**
 * Hand-tunes the abstention threshold (#9):
 *
 *   pnpm tune:threshold
 *
 * Embeds ~10 hand-written questions — on-corpus conceptual ones the demo must
 * answer, and off-corpus ones it must decline — through the SAME path serving
 * uses (embedQuery + workspace-filtered search), and prints each question's
 * top retrieval scores per provider. The threshold to pick sits in the gap
 * between the lowest on-corpus top-1 and the highest off-corpus top-1.
 *
 * Off-corpus includes the two deliberate hard cases: code retrieval (on
 * screen, never spoken) and topics whose episodes were dropped as Hindi-only
 * (closures, event loop) — those SHOULD abstain; see corpus/DECISIONS.md.
 */
import { DEMO_WORKSPACE_ID } from '../src/db/workspace';
import {
  API_KEY_ENV_VAR,
  createEmbeddingProvider,
  type EmbeddingProviderName,
} from '../src/embeddings/providers';
import { withQuotaRetry } from '../src/embeddings/quota-retry';
import { collectionNameFor } from '../src/vectors/collection-name';
import { QdrantVectorStore } from '../src/vectors/qdrant-vector-store';

const QUESTIONS: readonly { text: string; expect: 'answer' | 'abstain' }[] = [
  { text: 'What is an execution context and how is it created?', expect: 'answer' },
  { text: 'What is hoisting in JavaScript?', expect: 'answer' },
  { text: 'What is the difference between undefined and not defined?', expect: 'answer' },
  { text: 'Why are promises better than callbacks?', expect: 'answer' },
  { text: 'How does async/await actually work?', expect: 'answer' },
  { text: 'How does the this keyword behave in different contexts?', expect: 'answer' },
  // Code retrieval — on screen, never in the transcript.
  { text: 'Show me the exact code for the debounce implementation', expect: 'abstain' },
  // Dropped Hindi-only episodes (S1 ep. 10 and 15).
  { text: 'What is a closure in JavaScript?', expect: 'abstain' },
  { text: 'How does the event loop and callback queue work?', expect: 'abstain' },
  // Plainly out of domain.
  { text: 'What is the best recipe for chicken biryani?', expect: 'abstain' },
  { text: 'How does the useState hook work in React?', expect: 'abstain' },
];

const qdrantUrl = process.env.QDRANT_URL;
if (!qdrantUrl) throw new Error('QDRANT_URL is required');

for (const name of ['gemini', 'openai'] satisfies EmbeddingProviderName[]) {
  if (!process.env[API_KEY_ENV_VAR[name]]) {
    console.warn(`skipping ${name}: ${API_KEY_ENV_VAR[name]} not set`);
    continue;
  }
  const embedding = createEmbeddingProvider(name);
  const store = new QdrantVectorStore({
    url: qdrantUrl,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: collectionNameFor(embedding),
    dimensions: embedding.dimensions,
  });
  const info = await store.describeCollection();
  if (!info) {
    console.warn(`skipping ${name}: collection ${store.collectionName} does not exist — seed first`);
    continue;
  }

  console.log(`\n=== ${name} (${store.collectionName}) ===`);
  let lowestAnswer = Infinity;
  let highestAbstain = -Infinity;
  for (const q of QUESTIONS) {
    const vector = await withQuotaRetry(() => embedding.embedQuery(q.text));
    const matches = await store.search(vector, {
      workspaceId: DEMO_WORKSPACE_ID,
      limit: 3,
    });
    const top = matches[0]?.score ?? 0;
    if (q.expect === 'answer') lowestAnswer = Math.min(lowestAnswer, top);
    else highestAbstain = Math.max(highestAbstain, top);
    const scores = matches.map((m) => m.score.toFixed(3)).join('  ');
    console.log(`${q.expect === 'answer' ? 'ON ' : 'OFF'}  top: ${scores || '(no hits)'}  ${q.text}`);
  }

  console.log(`\nlowest on-corpus top-1:   ${lowestAnswer.toFixed(3)}`);
  console.log(`highest off-corpus top-1: ${highestAbstain.toFixed(3)}`);
  if (highestAbstain < lowestAnswer) {
    const mid = (lowestAnswer + highestAbstain) / 2;
    console.log(`separable — midpoint threshold: ${mid.toFixed(3)}`);
  } else {
    console.log('NOT cleanly separable — pick the floor that keeps every ON answered and accept the overlap, or reword the question set.');
  }
}
