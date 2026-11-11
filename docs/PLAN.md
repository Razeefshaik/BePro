# BePro: plan

Deadline: 2026-11-16 (IST). Four days. The target is the full spec, built solidly; the cut order in HANDOFF is only a fallback.

## Milestones

| Day | Done means |
| --- | --- |
| Day 1, 2026-11-13 | C01 to C04: fresh clone runs; schemas, validation pipeline with all ten test fixtures, real model calls on all four endpoints |
| Day 2, 2026-11-14 | C05 to C07: client data layer with stale guard and persistence; theme; start screen and road map with every state |
| Day 3, 2026-11-15 | C08 and C09: learn screen with all five visuals, quiz, retest, results, read further, doubt bot, sources, motivation |
| Day 4, 2026-11-16 | C10 and C11: mobile, keyboard, failure demo pass, README, recording, deploy if possible, submitted |

## Work split
| Who | Takes |
| --- | --- |
| razeef with Claude | the critical path, C01 to C08 |
| codex | bounded side cards when parallel time helps: pipeline fixtures, visual components, `quotes.json` |

## Design notes
Structure and data are in SPEC sections 3 to 9. Anything shared between server and client lives in `shared/` and is listed in `docs/CONTRACTS.md`.
