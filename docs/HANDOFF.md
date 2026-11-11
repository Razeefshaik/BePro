# BePro: handoff

Updated: 2026-11-12. Deadline: 2026-11-16 (IST), 4 days.

**`SPEC.md` at the repo root is the source of truth for the design.** This file only adds what the spec leaves out: the demo story, open questions and the cut order. Link to spec sections here; don't copy them.

Design canvas (all screens, Ink and Paper themes): https://claude.ai/artifact/QDDTYCNwXiQwmZAdmnGbzA
Assignment brief: `docs/assignment.pdf` (to be copied in by the owner).

## The story to demo (screen recording)
1. Start screen: pick Beginner and Crash course, type a topic, Build my road map. Skeleton stations while it loads.
2. Road map: rename or remove a station, use Adjust plan ("make it more practical"), Let's start.
3. Learn: flip a card with a chart or flow visual, Read further, rate one card "Review again", take the quiz and miss one.
4. Bad output handling: a partial banner, a dropped visual, a forced timeout with Try again, a quick double submit where the stale reply is ignored.
5. Results: score per station, Retest the N I missed.
6. Reload the page and the session comes back. Toggle Ink and Paper. Show phone width.

## Open questions
| Question | Status | Answer |
| --- | --- | --- |
| Deadline | closed | 2026-11-16 (IST), 4 days |
| LLM provider and model for the demo | partly | Development: local Codex CLI (`gpt-6-luna`). Submission still needs an openai-compatible free tier for graders |
| Deploy, or local only (deploy is preferred, optional) | open | |
| UI and theme direction | open | Owner picks next |

## Cut order if time runs short
The full spec is the target. This list only applies if day 4 arrives with gaps. Cut first, in this order: doubt bot, animation and image visuals, intermediate skip check, road map station toolbar (keep Adjust plan), "New questions on weak spots", sources panel, motivation note.

Always keep: the validation pipeline and its tests, the stale guard, the plan to cards to quiz to retest loop, loading, error and empty states, persistence, mobile layout, README.
