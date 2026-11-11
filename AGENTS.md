# BePro: guide for coding agents

Deadline: 2026-11-16 (IST).

Before starting, read:
1. `SPEC.md`: the source of truth for the design.
2. `docs/DECISIONS.md`: why each design choice was made.
3. `docs/PLAN.md`: the plan.
4. `docs/CONTRACTS.md`: the interfaces between owners.
5. `docs/TASKS.md` and your card: your task and the files it covers.

## Project rules (copied from CLAUDE.md)

- React with hooks and functional components, plain JavaScript (no TypeScript), plain CSS with the tokens in SPEC section 10.
- Only the approved dependencies in SPEC section 3. Ask before adding anything else.
- The API key never reaches the browser. Every model call goes through `server/`.
- No crashes on bad model output. Every request has loading, error and empty states. A stale response never overwrites a newer one.
- Code must be simple enough for the owner to explain line by line in the interview. Prefer plain, boring code over clever code.
- `npm install && npm start` must work from a fresh clone at every merge.

## Folder ownership

| Owner | Paths |
| --- | --- |
| razeef (with Claude) | everything by default |
| codex | only the files its card lists |
| **shared** (ask the owner first) | `shared/`, `package.json`, `SPEC.md`, `docs/CONTRACTS.md` |

If your card needs a file it doesn't list, stop and say so.

## Flow

- **One branch per card:** `razeef/c12-<slug>`, from fresh `main`. Use a separate worktree, `../BePro-c12`, for parallel work.
- **Commits:** one line, `C12: lowercase summary`, with no Co-Authored-By or any AI attribution.
- **Push your branch and report back using the card's format. The owner decides merges.**
- Record each design change as one line with a reason in `docs/DECISIONS.md`.

## Context keeping

- Start or resume by reading `docs/AGENT_STATE.md`, then only the relevant sections of `docs/AGENT_FUTURE_NOTES.md`. These orient the work; they don't replace the source documents or the owner's instructions. Check stale facts against Git.
- After each card and before handoff, rewrite the short state summary: completed work, commits, blockers, next steps. Move reusable detail into the future notes, grouped by task.
- Keep both concise and factual, with no secret values.
