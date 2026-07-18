# Corpus decisions

## Hindi-only episodes are dropped (2026-07-18)

Eleven of the 28 selected videos expose only a Hindi auto-generated caption
track through every InnerTube client (IOS, ANDROID, WEB): Ep. 5, 8, 9, 10, 11,
12, 14, 15, 16, 17, 18 of Season 1 — including the Closures (Ep. 10) and Event
Loop (Ep. 15) episodes. No manual English track exists for them, and YouTube's
`tlang=en` auto-translation endpoint refuses the requests (HTTP 429) even at
gentle request rates.

Per the spec's pre-agreed contingency ("spot-check for code-switching; drop
affected videos"), they are **dropped, not machine-translated**: a
Hindi-ASR-then-auto-translated transcript would degrade both embeddings and
the citation text the demo shows.

Consequences, by design:

- **Suggested questions avoid the dropped topics.** Nothing suggests closures,
  the event loop, `let`/`const`/TDZ, or `setTimeout` — the corpus would abstain
  (correctly) rather than answer.
- The 17 cached episodes cover: execution context, call stack, hoisting, how
  functions work, undefined vs not defined, scope chain & lexical environment,
  first-class functions, map/filter/reduce, and all of Season 2 — callback
  hell, promises, promise chaining, async/await, Promise APIs, and `this`.
- Re-including a dropped episode requires only its transcript appearing in
  `corpus/transcripts/` and a re-run of `pnpm seed:corpus` + `pnpm seed` —
  worth retrying `tlang=en` from a different network some day, or if English
  captions get added upstream.

## Track preference

Manual English captions ("en-IN", punctuated sentences) are preferred over
English ASR; a non-English track is never silently substituted — acquisition
throws instead.
