# Ask Namaste JavaScript

Chat over the [Namaste JavaScript](https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP)
series by [Akshay Saini](https://www.youtube.com/@akshaymarch7) — every answer
cites the exact second in the video, so you can click a timestamp and hear the
source say it.

**Live demo:** https://namaste-hackathon.satpal.cloud/

Built for the OpenAI × NamasteDev hackathon (July 2026). All video content
belongs to Akshay Saini; this is a non-commercial retrieval demo that
deep-links every claim back to his videos.

## The problem

Namaste JavaScript is roughly twenty hours of the best JavaScript teaching on
YouTube — and none of it is searchable. "Where does he explain why `undefined`
and *not defined* are different?" has no answer short of scrubbing through
episodes. Twenty hours of video is a wonderful course and a terrible reference.

## What this does

Ask a conceptual question and get a streamed answer grounded in the series'
transcripts. Sources render **before** the first token, each one a YouTube
deep link that lands on the second the claim was spoken. Inline `[n]` markers
in the answer resolve to the same links.

When the corpus doesn't cover a question, the system says so instead of
guessing. That is the trust mechanism: **grounded with citations, and abstains
below threshold.** "Never hallucinates" is not a claim any known technique can
back; this claim is defensible.

## Architecture

One Next.js app (App Router) on Vercel, seeded from a local script. Five
vendors, no more: Vercel, Neon, Qdrant, the LLM provider, Upstash.

```
corpus (local, one-time)                     serving (per request)
────────────────────────                     ─────────────────────
YouTube captions (youtubei.js)               question
  → transcript cache  corpus/transcripts/      → embed query
  → chunker  ~400 tokens, exact times          → Qdrant top-k (workspace-filtered)
  → Neon (source of truth)                     → hydrate from Neon      ─ leak guard
  → Qdrant × 2 collections                     → below threshold? abstain
      (gemini + openai spaces)                 → stream: sources first, then tokens
```

- **Neon Postgres + Drizzle** is the source of truth; Qdrant is only an index
  over it. Every table carries a `workspaceId` from day one — Stage 3 is
  multi-tenant, and retrofitting tenancy is brutal; carrying the column is
  cheap.
- **Hydration is the leak guard.** Vector hits are joined back to Postgres;
  a vector whose row is gone (stale index, half-failed delete) simply cannot
  be served.
- **Two vector collections are seeded up front** — one per embedding space
  (`gemini-embedding-001`, `text-embedding-3-small`). A single `PROVIDER` flag
  switches chat *and* embeddings together, so the dev→submission provider flip
  needs no reindex and cannot mix vector spaces.
- **A startup assertion refuses to serve** if the configured embedding model
  doesn't match the collection it points at — wrong-space cosine scores look
  plausible and fail silently; this fails loudly instead.
- **Sources are sent before the first token.** Retrieval finishes before
  generation starts, so the stream's first frame is the source list; the model
  cites `[n]` against a list the client already holds. Citations are resolved,
  never scraped out of prose.

## Key decisions, and why

**Abstention over confidence scores.** Below a retrieval-score floor the
system declines to answer. No confidence number is shown anywhere: LLM
self-reported confidence is uncalibrated and peaks exactly during fluent
hallucination, and cosine similarity is not a probability — any number shown
to a visitor must complete the sentence "this number means ___", and none of
these can. The floor is per-provider (cosine scales differ per embedding
model) and hand-tunable via `ABSTENTION_THRESHOLD`.

**Conceptual suggested questions only — never code retrieval.** Code lives on
screen, not in the transcript, so "show me the debounce implementation" fails
by construction — that information was never in the corpus. The suggested
questions steer first impressions toward what the system is actually good at.
This is demo design, not a workaround: those questions *should* abstain.

**Eleven Hindi-only episodes are dropped, not machine-translated** (S1 ep. 5,
8–12, 14–18, including Closures and the Event Loop). They expose only Hindi
ASR caption tracks; auto-translating would degrade both the embeddings and the
citation text shown to visitors. The 17 cached English episodes cover
execution context, hoisting, scope, `this`, and all of Season 2's async
material. Details in `corpus/DECISIONS.md`.

**Per-IP rate limit *and* a hard global daily cap.** An open unauthenticated
LLM endpoint is a free LLM proxy, and scanners find it. Sliding-window per-IP
limits shape organic traffic; only the global cap bounds liability, because
abusers rotate IPs. When the cap is hit the demo says so plainly — the worst
case is a disabled demo, not a bill.

**Dev on Gemini free tier, submit on OpenAI.** Both provider implementations
stay working; the flip is one flag pointing at an already-seeded collection,
guarded by the startup assertion — it happens at the hour care is lowest.

**Deliberately not built (Stage 1 discipline):** auth, user-triggered
ingestion, hybrid search, reranking, MMR, query rewriting, semantic chunking,
groundedness measurement, the eval harness. Each is real work that deserves a
measured before/after, not a deadline-week guess.

## Testing

- `pnpm test` — vitest correctness suite (chunker, tenancy filter, threshold,
  citation linkifier, vector-space assertion…). Fast, hermetic, no network.
- `pnpm test:e2e` — one Playwright happy path **against the deployed URL**
  (`PLAYWRIGHT_BASE_URL=https://… pnpm test:e2e`), desktop + mobile: ask a
  suggested question, assert the answer streams, sources arrive first, and the
  timestamp deep link carries the exact video and second. It gates submission
  and asserts plumbing only — retrieval *quality* is Stage 2's eval set, and
  conflating the two is how e2e suites go flaky and get ignored.

## Running it

```bash
pnpm install
cp .env.example .env        # fill in Neon, Qdrant, provider keys, Upstash
pnpm db:migrate             # Drizzle migrations against Neon
pnpm seed                   # Neon + BOTH Qdrant collections, from corpus/
pnpm dev
```

The transcript cache in `corpus/` is committed, so seeding never touches
YouTube. To rebuild the cache itself: `pnpm seed:corpus`.

## Future work

- **Stage 2 — retrieval depth, measured.** A ~50-question eval set written
  first, then hybrid search, reranking, query rewriting, MMR, a chunking
  experiment, and a `gemini-embedding-2` trial — each landing with a
  before/after number, ending in a published benchmark table. Groundedness
  gets measured, and the abstention threshold gets tuned against the eval set
  instead of by hand.
- **Stage 3 — the SaaS.** Auth, orgs, user-triggered ingestion with progress
  and retries, deletion that removes vectors with the video, an embeddable
  widget, API keys, analytics. The tenancy column every table already carries
  is the down payment.

## Credits

All teaching content is by **Akshay Saini** — watch
[Namaste JavaScript](https://www.youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP)
in full; the demo is a map of the series, not a replacement for it.
