# Hackathon Build Plan — OpenAI × NamasteDev Codex Hackathon

**Deadline: 23:59 IST, Sun 19 July 2026.** Today is Thu 16 July. **~3.5 days.**

This supersedes the 3-stage timeline in `spec.md`. All architecture decisions in
that spec still stand. Stages 2 and 3 become "Future Work" in the README.

---

## Required deliverables (all three, or the submission is invalid)

1. **Live prototype**, publicly accessible to judges.
2. **Public demo video** — walks through problem, solution, flow.
3. **Public codebase + README.**

Judged on: innovation, execution, impact, **product quality**, **meaningful use
of AI**, creativity.

## The two rules

1. **Deploy on Day 1, not Day 3.** A hello-world goes to Vercel today. First
   deploys always break; discovering that on Sunday night is how hackathons are
   lost. After today, every day ends deployed.
2. **Transcripts first, before anything else.** If transcripts don't come, there
   is no project. It's the single highest-risk dependency and it must be proven
   in the first hour, not the last.

## Ordering principle

Anything that can kill the project gets touched **today**. Polish is Day 3, when
what's left is only work that *improves* a thing that already exists.

---

## Day 1 — Thu 16 July: prove the risky parts, get a corpus

- [ ] **Fetch one transcript.** Just one. Prove the pipeline's riskiest
      dependency before building anything around it.
- [ ] Scaffold Next.js + TS + Tailwind + shadcn.
- [ ] **Deploy hello-world to Vercel.** Non-negotiable.
- [ ] Neon project + Drizzle schema — 7 tables, `workspaceId` on every one.
- [ ] Qdrant Cloud free cluster; collection name derived from provider+model+dims;
      `workspaceId` payload index with `is_tenant: true`.
- [ ] Resolve `@akshaymarch7` → list videos → **select Namaste JavaScript only**.
- [ ] Fetch + cache all ~29 transcripts to the repo as JSON. Commit them.
- [ ] Spot-check 2–3 transcripts for Hindi code-switching.
- [ ] Chunker: ~400-token windows, ~15% overlap, start/end times off the segments.
- [ ] Embed + upsert → **seed both collections** (Gemini 3072 + OpenAI 1536).

**Exit: `pnpm seed` puts ~650 chunks into Neon and both Qdrant collections.**

## Day 2 — Fri 17 July: the product

- [ ] Chat route: embed query → Qdrant search (`workspaceId` filter) → hydrate
      from Postgres by ID → build prompt → stream.
- [ ] AI SDK `streamText`; **sources sent as a data part before the first token**.
- [ ] Prompt: answer only from context, emit inline `[n]` markers.
- [ ] Chat UI: streaming, markdown, code blocks.
- [ ] Sources panel + timestamp cards; `[n]` markers resolve client-side.
- [ ] YouTube deep links (`watch?v=ID&t=SECONDS`) — **click one and verify it
      lands on the right second.** This is the whole demo.
- [ ] Startup assertion: configured model vs collection's recorded model.

**Exit: working chat locally, with citations that land on the right moment.**

## Day 3 — Sat 18 July: make it real

- [ ] Abstention threshold — tune by hand on ~10 questions, incl. off-corpus ones.
- [ ] Upstash rate limit per IP + **hard global daily budget cap**.
- [ ] Suggested questions — **conceptual only** (hoisting, closures, event loop).
      Never code-retrieval; that content is on-screen, not in the transcript.
- [ ] UI polish. "Product quality" is an explicit judging criterion — this is
      scored work, not vanity.
- [ ] Mobile check. Judges will open it on a phone.
- [ ] Empty/error/loading/limit-reached states.
- [ ] **Deploy. Test the live URL from a different device/network.**

**Exit: a public URL a stranger can use without help.**

## Day 4 — Sun 19 July: switch, film, ship (target 20:00 IST, not 23:59)

- [ ] Flip provider flag → OpenAI. Collection is already seeded; no reindex.
- [ ] **Re-verify: 5 questions, check citations still land correctly.** Prompts
      were tuned on Gemini; GPT may need small adjustments.
- [ ] Demo video (2–3 min): the problem (20h of video, unsearchable) → ask a
      question → **click the timestamp, let it play** → that's the money shot.
- [ ] README: problem, architecture, key decisions *and why*, future work
      (Stages 2–3), attribution to Akshay Saini.
- [ ] Submit with **~4 hours of buffer.**

---

## Cut for the deadline (was Stage 1, now out)

Idempotent re-ingestion (the seed runs once) · conversation history persistence ·
conversation search · Inngest (seeding is a local script) · Clerk (chat is
anonymous) · everything already deferred to Stages 2–3.

## Risks

| Risk | Mitigation |
|---|---|
| Transcripts unavailable/blocked | **Hour 1 of Day 1.** Cached to repo once fetched; prod never scrapes. |
| First deploy breaks | Deploy hello-world today; deploy daily after. |
| Provider switch corrupts retrieval | Both collections pre-seeded + derived names + startup assertion. |
| Prompt tuned on Gemini misbehaves on GPT | Re-verify 5 questions on Day 4; budget 30 min. |
| Hindi code-switching degrades embeddings | Spot-check Day 1; drop affected videos. |
| Code-on-screen questions fail | Suggested questions are conceptual by design. |
| Running out of time | Ship deployed daily — any day's build is submittable. |

## Open items

- **Check whether the hackathon issued OpenAI API credits.** If so, the entire
  dev-on-free-tier plan is unnecessary.
- Attribute Akshay Saini prominently. His hackathon, his content, likely his
  judgement.
