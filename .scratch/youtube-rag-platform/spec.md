# Spec: YouTube Knowledge Platform

**Status:** Ready for build (Stage 1)
**Label:** `ready-for-agent` *(cannot be applied — no tracker configured; run `/setup-matt-pocock-skills`)*

---

## Problem Statement

Akshay Saini's *Namaste JavaScript* series is roughly 20 hours of dense, verbal
explanation. A developer who wants to know "what's the difference between `var`
and `let` in terms of hoisting?" knows the answer is in there somewhere. Finding
it means guessing an episode, scrubbing a timeline, and re-watching material they
have already seen. The knowledge is public and free, and still effectively
unsearchable — YouTube search matches titles and descriptions, not the sentence
spoken at 14:32.

This is the general problem for every long-form educational channel: **the
transcript holds the answer, but nothing indexes the transcript.**

### Project context (this determines every scoping decision below)

This is a **portfolio and learning build**. No customer is waiting for it and no
revenue depends on it. Success is defined as:

1. It **exists** — deployed, public, reachable at a URL.
2. It **demos well** — a stranger clicks the link, asks a question, gets a
   correct cited answer, and clicks through to the exact moment in the video.
3. It **still works in eight months**, unattended, without a maintenance budget.

Every requirement in this spec is subordinate to those three. Where the original
brief called for enterprise scale ("millions of vectors, thousands of concurrent
users"), those numbers describe no real traffic and are treated as **aspiration,
not requirement**. The demo corpus is **≈600–700 vectors**. Designs are chosen to
be correct at that scale and to not foreclose a larger one — not to pay for it now.

**Time budget:** ~20 hrs/week sustained. The full arc is ~9 months at that rate.
This is why the work is **sequenced into three stages**, each independently
demoable and independently a portfolio piece. Most side projects stop early; the
sequencing ensures that stopping early still leaves something complete.

---

## Solution

A retrieval system over YouTube transcripts, exposed as a chat interface that
answers **only** from the indexed videos and cites its sources with clickable
timestamp deep links.

The distinguishing mechanic is **self-verifying citations**. Every answer carries
the video and the timestamp; clicking it opens YouTube at that second, where the
visitor *hears the source say it*. No trust in the model is required. This also
sets the demo strategy: the corpus must be content the audience recognises, so
answers are instantly checkable.

The build is sequenced:

- **Stage 1 (wk 1–3) — the slice.** A seed script (run locally) ingests the
  selected videos. The deployed app serves anonymous chat over that corpus, with
  streaming answers, sources, timestamp deep links, and abstention. **Exit
  criterion: a stranger asks a question and clicks through to the exact moment.**
- **Stage 2 (wk 4–10) — retrieval depth, measured.** An eval set is written
  *first*. Then hybrid search, reranking, query rewriting, MMR, a chunking
  experiment, and the `gemini-embedding-2` spike — each landing with a
  before/after number. **Exit criterion: a benchmark table.**
- **Stage 3 (wk 11+) — the SaaS.** Auth, tenancy, user-triggered ingestion,
  events, API keys, the embeddable widget, analytics, admin. **Exit criterion:
  cross-tenant isolation tests that pass.**

Stages 2 and 3 are described at low resolution deliberately. Their detailed
design happens when they are reached, informed by a running system.

---

## User Stories

### Stage 1 — Anonymous chat over a seeded corpus

1. As a visitor, I want the demo to load with a corpus already indexed, so that I
   can ask a question without creating an account or waiting for ingestion.
2. As a visitor, I want to see suggested questions on arrival, so that I know
   what this system is good at without having to guess.
3. As a visitor, I want suggested questions that are **conceptual** rather than
   code-retrieval, so that my first impression is of the system working rather
   than failing.
4. As a visitor, I want to type a question in plain language, so that I don't
   have to learn a query syntax.
5. As a visitor, I want the answer to begin streaming within ~2 seconds, so that
   I can tell the system is alive rather than broken.
6. As a visitor, I want the source list to appear *before* the answer text
   starts, so that the interface feels immediate even when the model is slow.
7. As a visitor, I want each answer to cite which videos it drew from, so that I
   can judge whether to trust it.
8. As a visitor, I want inline markers in the answer text linking claims to
   specific sources, so that I can tell *which* part came from *where*.
9. As a visitor, I want each citation to show a timestamp, so that I know where
   in a 40-minute video the claim came from.
10. As a visitor, I want to click a timestamp and land on YouTube at that exact
    second, so that I can verify the answer against the source myself.
11. As a visitor, I want the system to say "I couldn't find this in the uploaded
    videos" when the corpus doesn't cover my question, so that I am never handed
    a confident fabrication.
12. As a visitor, I want to ask a follow-up question that understands the
    previous turn, so that I can refine without repeating myself.
13. As a visitor, I want the answer rendered as markdown with code blocks, so
    that technical content is readable.
14. As a visitor, I want to see which channel and series I'm querying, so that I
    understand the scope of what I'm asking.
15. As a visitor on a phone, I want the chat and sources to be usable, so that I
    can try it from a link on social media.
16. As a visitor, I want a clear message when the demo's daily limit is reached,
    so that I understand it's a cost cap rather than a broken app.
17. As the project owner, I want anonymous usage rate-limited per IP, so that
    casual abuse doesn't degrade the demo for real visitors.
18. As the project owner, I want a hard global daily spend cap, so that my worst
    case is a disabled demo rather than an unbounded bill.
19. As the project owner, I want the deployed app to never scrape YouTube, so
    that datacenter IP blocking cannot break the demo.
20. As the project owner, I want to run ingestion from my laptop, so that
    transcript fetching happens from a residential IP where it works.
21. As the project owner, I want to resolve a channel from its handle URL, so
    that ingestion starts from the same input a real user would provide.
22. As the project owner, I want to list all videos on a channel with metadata,
    so that I can choose which ones enter the knowledge base.
23. As the project owner, I want to select a subset of videos (the series, not
    the vlogs), so that the corpus stays topically coherent and retrieval stays
    sharp.
24. As the project owner, I want raw transcripts stored verbatim, so that I can
    re-chunk and re-embed later without re-fetching.
25. As the project owner, I want transcripts cached in the repo or database, so
    that seeding is reproducible and does not depend on YouTube being cooperative.
26. As the project owner, I want each chunk to carry exact start and end times
    derived from caption segments, so that citations are precise rather than
    inferred.
27. As the project owner, I want embeddings generated in batches with retry, so
    that a transient failure doesn't force a full re-run.
28. As the project owner, I want ingestion to be idempotent, so that re-running
    the seed doesn't duplicate chunks or vectors.
29. As the project owner, I want the app to refuse to boot if the configured
    embedding model doesn't match the one recorded on the collection, so that a
    silent vector-space mismatch is impossible.
30. As the project owner, I want every table row and every vector to carry a
    workspace identifier from the first commit, so that tenancy is never a
    retrofit.
31. As the project owner, I want to spot-check transcripts for mixed-language
    content during seeding, so that I catch code-switching that would degrade
    embeddings.
32. As the project owner, I want the deployed demo to depend on as few vendors as
    possible, so that it survives unattended for years.

### Stage 2 — Retrieval quality, measured

33. As the project owner, I want a hand-written eval set of ~50 question/answer
    pairs over the corpus, so that every subsequent change can be judged by a
    number rather than a vibe.
34. As the project owner, I want the eval suite kept separate from correctness
    tests, so that a quality regression never fails CI as though it were a bug.
35. As the project owner, I want to measure baseline retrieval before adding any
    technique, so that I can prove each addition earned its complexity.
36. As the project owner, I want to compare chunking strategies against the eval
    set, so that chunk size and overlap are chosen by evidence.
37. As the project owner, I want to add hybrid (keyword + semantic) search and
    measure it, so that exact-term questions stop failing.
38. As the project owner, I want to add reranking and measure it, so that I know
    whether the latency and cost are justified.
39. As the project owner, I want to add query rewriting and measure it, so that
    follow-up questions with pronouns resolve correctly.
40. As the project owner, I want to evaluate MMR, so that near-duplicate chunks
    stop crowding out diverse sources.
41. As the project owner, I want to trial `gemini-embedding-2` against
    `gemini-embedding-001` on the same eval set, so that the multimodal option is
    a benchmark rather than a bet.
42. As the project owner, I want to measure answer groundedness, so that I can
    make a defensible claim about hallucination rate instead of an unfalsifiable
    one.
43. As the project owner, I want to tune the abstention threshold against the
    eval set, so that the system declines when it should and only when it should.
44. As the project owner, I want a published benchmark table, so that the
    retrieval work is legible to a reader who never runs the code.

### Stage 3 — Multi-tenant SaaS

45. As a creator, I want to sign in, so that I can build a knowledge base from my
    own channel.
46. As a creator, I want to paste a channel URL, handle, ID, playlist, or
    username, so that I don't have to know which identifier the system wants.
47. As a creator, I want to browse my channel's videos with thumbnails, duration,
    and publish date, so that I can decide what to include.
48. As a creator, I want to select individual videos, multiple videos, a
    playlist, or a whole channel, so that I control the corpus.
49. As a creator, I want ingestion to run in the background with visible
    progress, so that I can close the tab and come back.
50. As a creator, I want failed ingestion jobs to retry automatically, so that a
    transient error doesn't cost me the whole batch.
51. As a creator, I want to see which videos failed and why, so that I can act on
    the ones that need me.
52. As a creator, I want to delete a video and have its vectors disappear with
    it, so that removed content stops appearing in answers.
53. As a creator, I want to set custom instructions and a system prompt, so that
    the bot answers in my voice.
54. As a creator, I want to test the chatbot in the dashboard before publishing,
    so that I can check quality privately.
55. As a creator, I want to generate an embeddable widget, so that the bot can
    live on my own site.
56. As a creator, I want a plain HTML script-tag snippet, so that it works on
    WordPress, Webflow, Shopify, or any no-code platform.
57. As a creator, I want to customise the widget's colour, position, avatar,
    welcome message, and prompt examples, so that it matches my brand.
58. As a creator, I want the widget to respect light and dark mode, so that it
    doesn't clash with the host site.
59. As a creator, I want to restrict my widget to specific domains, so that
    others can't embed my bot and spend my quota.
60. As a creator, I want to create multiple scoped API keys, so that I can
    integrate without over-granting access.
61. As a creator, I want to rotate, revoke, and expire API keys, so that a leaked
    key is a recoverable incident.
62. As a creator, I want to see usage logs per key, so that I can attribute
    traffic and spot abuse.
63. As a creator, I want to see message volume, top questions, and popular
    videos, so that I learn what my audience actually wants.
64. As a creator, I want to see token usage and estimated cost, so that spend
    never surprises me.
65. As a creator, I want to search past conversations, so that I can review what
    people asked.
66. As an agency admin, I want multiple isolated workspaces under one
    organisation, so that client data never mixes.
67. As an agency admin, I want to invite teammates with Admin, Editor, or Viewer
    roles, so that access matches responsibility.
68. As an agency admin, I want a viewer to be unable to modify a knowledge base,
    so that permissions are real rather than cosmetic.
69. As any user, I want a request for another workspace's data to fail, so that
    isolation is enforced rather than assumed.
70. As the project owner, I want automated tests proving no cross-workspace
    leakage, so that the isolation claim is evidence-backed.
71. As the project owner, I want an audit log of sensitive actions, so that
    changes are attributable.
72. As the project owner, I want to see job queue health and failed jobs, so that
    I can operate the system.
73. As the project owner, I want expensive work to be event-driven and idempotent,
    so that retries are safe.
74. As the project owner, I want a dead-letter queue, so that permanently failing
    jobs are visible rather than silent.
75. As the project owner, I want to add a new knowledge source (PDF, website)
    without redesigning ingestion, so that the roadmap stays open.

---

## Implementation Decisions

These were settled during a grilling session. **They are not to be relitigated
without new information.** Where a decision reverses the original brief, the
reason is recorded.

### Framing

- **The project is a portfolio build.** Enterprise scale numbers are aspiration,
  not requirement. Designs must be *correct* at ≈600–700 vectors and must not
  foreclose growth; they must not pay for growth now.
- **Work is sequenced, not parallel.** Stage 1 ships deployed before Stage 2
  begins. The original brief's implied schema-first order (25 tables and 11
  packages before the first chat response) is rejected: it produces no demoable
  artifact until month 3–4 and commits 25 tables' worth of decisions with zero
  feedback from a running system.
- **`workspaceId` is on every table and every vector payload from commit #1.**
  The tenant *column* is cheap on day 1 and brutal on day 90; the tenant *UI* is
  brutal on day 1 and cheap on day 90. Stage 1 uses a hardcoded workspace
  constant; orgs, roles, invitations, and the workspace switcher are Stage 3.

### Transcript acquisition

- **A `TranscriptProvider` interface isolates transcript acquisition.** This is
  the single highest-risk dependency in the product.
- **The official YouTube Data API cannot serve this use case.** `captions.download`
  requires OAuth as the video's owner, so arbitrary-channel ingestion is not
  available through it. This is a hard constraint, not a configuration problem.
- **Scraper implementations run only on the developer's machine** (a residential
  IP), never in the deployed app. YouTube blocks the `timedtext` endpoint from
  datacenter IP ranges; a scraper in production works in dev and silently returns
  nothing in prod.
- **The demo serves pre-fetched, cached transcripts.** The public demo has no
  live dependency on YouTube. This is both the reliability strategy and the demo
  strategy — a visitor chats instantly with no ingestion wait.
- **`speaker` is removed from the chunk model.** YouTube ASR captions carry no
  diarization. The field was fiction.

### Corpus

- **Corpus: Akshay Saini (`@akshaymarch7`), scoped to the Namaste JavaScript
  series only** — not Namaste React, not the complete channel. Vlogs, interviews,
  and career content make the corpus heterogeneous and degrade retrieval; React
  content would broaden the topic space without deepening it.
- **Corpus size: ~29 videos, ~15–20 hours, ≈600–700 chunks.** Smaller than
  initially estimated. This is a feature: a full reindex is seconds, embedding
  cost rounds to zero, and a tightly-scoped corpus retrieves more sharply than a
  broad one.
- **Scoping to the series is the specced product flow, not a deviation:** resolve
  the full channel, list all videos, *select* the series. Selection is
  demonstrated and the corpus stays coherent.
- **The corpus was chosen for recognisability.** A demo only impresses if the
  visitor can verify the answer. Namaste JavaScript is widely known among JS
  developers, so answers are instantly checkable.
- **Known limitation: code-heavy tutorials are the hard case.** Valuable content
  is often on-screen, not spoken. Conceptual questions will work; code-retrieval
  questions ("show me the debounce implementation") will fail because the
  information was never in the corpus. **Suggested questions must be
  conceptual.** This is a demo-design decision, not a bug to fix.

### Storage and tenancy

- **Vectors: Qdrant. One collection for all tenants**, with `workspaceId` as an
  indexed payload filter using the `is_tenant: true` index parameter, which
  co-locates each tenant's points on disk. Collection-per-tenant is rejected — it
  fails at scale.
- **Payload is thin: identifiers and filter fields only** (`workspaceId`,
  `videoId`, `chunkId`). Text, titles, and timestamps hydrate from Postgres by ID
  after search.
- **Rationale — this is a correctness decision, not a performance one.** A fat
  payload means the read path never consults Postgres, so (a) an orphaned vector
  from a half-failed delete is still *served*, turning a dropped HTTP call into a
  data leak, and (b) metadata goes stale silently on any edit. Hydration means a
  chunk with no Postgres row **cannot be returned**. The no-leakage guarantee
  rests on a join rather than on flawless retry logic.
- **Postgres (Neon) is the source of truth. Qdrant is an index.**
- **Metadata: Neon Postgres + Drizzle.** Stage 1 schema is ~7 tables
  (workspaces, channels, videos, transcripts, chunks, chats, messages) — not the
  25 in the original brief. The remainder arrive in Stage 3 when they do work.

### AI providers

- **The "one config for all providers" principle is half-true and must be split.**
  Chat is a commodity; embeddings are not. Google's OpenAI-compatibility layer
  proves it: it supports `model` and `input` for embeddings but **not**
  `dimensions` and **not** `task_type` — it drops exactly the embedding-specific
  quality knobs.
- **Provider swapping is via the Vercel AI SDK**, one flag for chat *and*
  embeddings. Dev default is Gemini (free); the submitted build runs OpenAI. Both
  provider impls stay working — the swap is a judging story, not just plumbing.
- **Collection names are derived from provider + model + dimensions**
  (`njs_chunks_gemini_3072`, `njs_chunks_openai_1536`), never configured
  separately or they drift. **Both collections are seeded up front** (~2 min, <1
  cent), so switching providers points at an already-populated collection: no
  reindex under deadline, no dimension rejection, no silent vector-space
  corruption, and the two can be A/B'd on identical questions.
- **The startup assertion is mandatory, not optional** — it guards exactly the
  provider-switch scenario, at exactly the hour care is lowest.
- **Chat: OpenAI SDK + configurable `baseURL`/`apiKey`/`model`.** Genuinely
  swappable per request. The original brief is correct here.
- **Embeddings: `gemini-embedding-001` at 3072 dimensions (dev) /
  `text-embedding-3-small` at 1536 (submission).** Chosen over `gemini-embedding-2` because 001 is GA while
  embedding-2 is preview: a deprecated preview model means queries can no longer
  be embedded into the same vector space as stored vectors, which kills the demo
  outright rather than degrading it. Both are free on the free tier; 001 is also
  cheaper when paid ($0.15/M vs $0.20/M).
- **`task_type` asymmetry is used**: `RETRIEVAL_DOCUMENT` when embedding chunks,
  `RETRIEVAL_QUERY` when embedding questions. Only reachable via the native SDK.
- **3072 dimensions avoids the truncation footgun** — `gemini-embedding-001`
  requires manual re-normalisation below 3072. At this corpus size the memory
  saving is worthless.
- **The embedding model is a property of the collection, not a runtime setting.**
  It is recorded on the collection and asserted at startup; a mismatch fails the
  boot loudly. This matters because a mismatched vector space produces **no
  error** — Qdrant accepts every write and returns quietly meaningless
  neighbours.
- **Reindexing is cheap at this scale** (well under a minute, a fraction of a
  cent, for ~650 chunks), so the model choice is reversible. The startup assertion exists to prevent the
  *silent* failure, not the migration.
- **Note for Stage 3: the Gemini free tier trains on submitted data.** This is
  acceptable for a public demo over public videos and is **incompatible with the
  multi-tenant SaaS claim** the moment real customer data is involved.
- **Free-tier rate limits are per-project**: a traffic spike 429s every user at
  once rather than degrading gracefully. A fallback (paid key or queue-and-retry)
  is needed before any publicity.

### Chunking

- **Token-window chunking (~400 tokens, ~15% overlap) over caption segments.**
  `startTime`/`endTime` are read directly off the constituent segments — exact,
  not inferred.
- **LangChain is removed from the project.** It does nothing here. ASR captions
  are punctuation-free word fragments with timings: `RecursiveCharacterTextSplitter`
  finds no `\n\n` or `\n` and degrades to splitting on spaces, and semantic
  chunking cannot run at all without sentences to embed.
- **Chunk size is dictated by citation granularity, not model limits.** Timestamp
  deep links are the headline feature, so chunks stay small enough to make "jump
  to 14:32" precise. Both models' context windows (2,048 / 8,192) are irrelevant —
  a whole 40-minute video is only ~8k tokens.
- **Chunking strategy is a Stage 2 experiment**, measured against the eval set.

### Answer contract

- **No confidence number is displayed.** LLM self-reported confidence is
  uncalibrated and fails in the worst possible way: it is *highest* when
  retrieved context reads fluently regardless of relevance — i.e. exactly during
  a hallucination. Cosine similarity is not a probability and its scale shifts
  with the embedding model.
- **Abstention is the trust mechanism.** Below a retrieval-score threshold the
  system answers "I couldn't find this in the uploaded videos." The threshold is
  tuned against the eval set in Stage 2.
- **"Never hallucinate" is removed as a claim.** It is not achievable by any
  known technique. The defensible claim is: grounded with citations, abstains
  below threshold, with a measured groundedness number (Stage 2).
- **Bar for shipping any score: it must complete the sentence "this number means
  ___" in terms a user would understand.**

### Streaming and citations

- **Sources are sent first, as a metadata frame, before the first token.**
  Sources are *known at retrieval time* — the model does not discover them. The
  sources panel and timestamp cards render before generation begins, which makes
  the app feel faster than a non-streaming one.
- **The model emits inline `[n]` markers** referencing the numbered chunks in its
  prompt; the UI resolves them against the source list it already holds.
- **JSON mode is rejected for the chat response.** Streaming a JSON object yields
  malformed frames until the last one, forcing either full buffering (destroying
  the streaming that hides latency) or a partial-JSON parser. It also lets the
  model hallucinate a source ID — a citation bug in a product whose pitch is
  citations.
- **Vercel AI SDK is adopted for the stream protocol.** Unlike LangChain it earns
  its place: streaming chat UI (message state, partial frames, aborts, resumable
  streams) is the actual hard part of Stage 1, and its data-parts protocol is
  built for "send sources, then stream prose."

### Application shape

- **One Next.js app on Vercel.** No Turborepo, no `apps/api`, no `apps/worker`,
  no Docker, no Coolify, no Nginx/Caddy, no VPS.
- **Rationale: Inngest is not a worker queue.** Functions are defined in the app,
  exposed at a single route, and *invoked over HTTP by Inngest's service*. Each
  `step.run` is its own invocation, so a workflow may run for hours while each
  step fits inside a normal serverless timeout. **No long-running process exists
  in this design**, so a worker has nothing to do. `apps/api` is likewise
  redundant — route handlers are the API, and splitting them adds a deploy
  target, CORS between own services, and duplicated auth.
- **A package earns its existence when it has a second consumer.** Every proposed
  package has exactly one. **Turborepo arrives in Stage 3 with the widget**,
  which genuinely must be a separate bundle because it ships to third-party
  sites. Retrofitting Turborepo onto a Next.js app is ~half a day.
- **Stage 1 needs neither Clerk nor Inngest.** Chat is anonymous, and seeding is
  a script run from a laptop. **Stage 3 does not build the ingestion pipeline —
  it puts auth and a UI on the pipeline Stage 1 already built.** Clerk and Inngest
  arrive then, because that is when they do work.
- **Vendors: 5 in Stage 1** (Vercel, Neon, Qdrant, Gemini, Upstash), down from 9
  in the original brief. Cloudflare R2 is cut — Stage 1 stores no objects.

### Cost and abuse

- **The read path is open; the write path is gated.** Chat on the seeded corpus
  is anonymous and cheap. Ingestion is expensive and requires an account
  (Stage 3).
- **Organic traffic is not the cost risk** — ~1,000 questions is roughly $1.35 on
  Flash pricing, and $0 on the free tier.
- **Abuse is the cost risk.** An open unauthenticated LLM endpoint is a free LLM
  proxy and gets found by scanners.
- **Two distinct controls, both required:** per-IP sliding-window rate limits
  **shape** organic traffic; a **hard global daily budget cap bounds liability**.
  Rate limits do not bound the worst case, because abusers rotate IPs. On cap
  exhaustion the demo says "demo limit reached, back tomorrow" rather than
  billing.

### Naming

- **Nothing is "trained."** No weights change; this is retrieval plus prompting.
  `training_jobs` → **`ingestion_jobs`**; "Training Completed" → "Ingestion
  Completed". Acceptable as landing-page copy, not as domain vocabulary — it
  misleads every future reader, and in an interview it reads as not knowing the
  difference.
- **Established vocabulary:** workspace, channel, video, transcript, *segment*
  (raw caption unit), *chunk* (embedded unit), knowledge base, citation,
  abstention, seed corpus, ingestion job.

---

## Testing Decisions

### What makes a good test here

Tests assert **external behaviour at the highest available seam** — what a
visitor or caller observes, never internal call sequences. A test that breaks
when a function is renamed but behaviour is unchanged is a liability. Every fake
boundary in this project is an interface that **already exists for a product
reason**; no test-only seams are introduced.

### The critical distinction

**Correctness tests and quality evals are different suites with different failure
meanings, and must never share a runner.**

- **Correctness tests** — fast, deterministic, faked providers. They ask *"is the
  plumbing right?"*: is the tenant filter applied, do sources arrive before the
  first token, does abstention fire below threshold, are timestamps exact. These
  gate CI.
- **Quality evals** (Stage 2) — slow, real Gemini + real Qdrant, run against the
  eval set. They ask *"is retrieval good?"*: does asking about closures return the
  closures chunk. These produce a **score**, not a pass/fail. **A quality
  regression must never fail Stage 1 CI** — conflating the two is how RAG suites
  become flaky and get ignored.

### Seams

- **Primary seam — the chat HTTP endpoint.** The product's only real entry point.
  Retrieval, tenant filtering, hydration, thresholding, prompt construction, and
  streaming are all exercised through it. Assertions: the sources frame precedes
  the first token; `[n]` markers resolve to real sources; abstention fires below
  threshold; the `workspaceId` filter is always applied; a chunk with no Postgres
  row is never served (the orphan case).
- **Fixture / invariant seam — the ingestion entrypoint.** Builds test corpora and
  carries its own assertions: payload contains only identifiers and filter
  fields; every point carries `workspaceId`; chunk timestamps match source
  segments exactly; re-running is idempotent.
- **The chunker is tested directly as a pure function** — segments in, chunks out.
  It is not a seam; it is a function.
- **Fakes are injected at four interfaces**, each of which exists for a product
  reason: `TranscriptProvider` (scrape isolation), `EmbeddingProvider` (the
  embedding-2 spike), `ChatProvider` (`baseURL` swapping), `VectorStore` (the
  Qdrant boundary).

### Prior art

None — greenfield. These seams become the prior art. Test stack: **Vitest** for
correctness, **Playwright** for the deployed demo's happy path (ask → stream →
sources → timestamp link resolves).

### Stage 3 additions

Cross-tenant isolation tests are a **required exit criterion**, not a nice-to-have:
the isolation claim must be evidence-backed. Every workspace-scoped read must be
proven to fail for a foreign workspace.

---

## Out of Scope

**Cut permanently (with reasons above):** LangChain; a confidence score; the
"never hallucinate" claim; the `speaker` field; `apps/worker`; `apps/api`; Docker;
Coolify; Nginx/Caddy; a VPS; Cloudflare R2; collection-per-tenant; fat payloads;
JSON-mode chat responses; live scraping in production.

**Deferred to Stage 2** (do not build in Stage 1): hybrid search; reranking; MMR;
query rewriting; context compression; semantic chunking; the `gemini-embedding-2`
trial; groundedness measurement; the eval harness.

**Deferred to Stage 3** (do not build in Stage 1): Clerk and all auth; orgs,
workspaces UI, memberships, roles, invitations; Inngest and the event
architecture; DLQ; user-triggered ingestion; the widget and its embed variants;
API keys and scopes; the analytics dashboard; the admin dashboard; webhooks;
OpenAPI docs; billing tables; the remaining ~18 database tables; Turborepo.

**Deferred indefinitely (roadmap, not backlog):** PDF/website/Notion/Drive
sources; voice agents; multimodal RAG; agentic workflows; MCP support. The
provider interfaces are the extension points; nothing is built for them now.

**Explicit non-goals:** millions of vectors; thousands of concurrent users;
99.9% uptime; SOC2 or compliance work; a paid tier.

---

## Further Notes

**On the corpus and courtesy.** Cached transcripts of another creator's public
videos are being served publicly. For a small, attributed, non-commercial
portfolio demo that deep-links back to the source, this is what essentially every
RAG demo does and the practical risk is very low. It stops being low the moment
this takes payment. **Attribute Akshay Saini clearly and prominently, always link
back to the source video, keep the corpus small.** There is upside in doing this
gracefully: a well-built demo over a well-known series may be noticed by the
creator himself.

**On multimodal video embedding.** `gemini-embedding-2` accepts video and audio,
which is tempting for a YouTube product and would sidestep the on-screen-code
limitation. Note the pricing before designing around it: **video is $12/M tokens
and audio $6.50/M**, versus $0.20/M for text. Text embedding costs pennies; video
embedding is where real money appears.

**On the 9-month estimate.** ~20 hrs/week × ~9 months reaches the full arc, and
depends entirely on still caring in month seven. That is what the sequencing
protects: each stage exits at something demoable, so stopping early leaves
something complete rather than an impressive README over a dead link.

**On what a reader actually evaluates.** Nobody will read the event taxonomy.
They will click the link, type a question, and judge the project on whether a
correct, cited answer comes back. Stage 1 *is* the portfolio; Stages 2 and 3
deepen a thing that already works.

**Blocked on setup.** `/setup-matt-pocock-skills` has not been run and this is not
a git repository, so no tracker exists to publish into and the `ready-for-agent`
label cannot be applied. Recommended: `git init`, then `/setup-matt-pocock-skills`
selecting the **local markdown** tracker.
