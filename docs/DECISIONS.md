# BePro: decisions

One row per design change, with its reason. Add a dated section per batch of work.

## 2026-11-12 Start

| Decision | By | Status | Reason |
| --- | --- | --- | --- |
| `SPEC.md` at the repo root is the design source of truth; HANDOFF only links to it | razeef | Accept | One place to change the design, so copies can't drift |
| BePro is its own git repo, separate from the parent StudyResource repo | razeef | Accept | The submission must be a clean public repo |
| Plain JavaScript, plain CSS, approved dependency list only | razeef | Accept | Every line must be explainable in the interview |
| Schedule is 4 days to 2026-11-16, not 8 hours; build the full spec | razeef | Accept | Owner's call; the cut order is only a fallback |
| `provider.js` has two modes via `LLM_PROVIDER`: `openai` (fetch) and `codex` (spawns `codex exec` with the prompt on stdin, `-s read-only --ephemeral --skip-git-repo-check`, run in an empty temp dir, answer read from `-o` file) | razeef | Accept | Free local development on the owner's Codex login; no new dependency (Node `child_process`); graders still use the openai path |
| Provider timeout comes from `LLM_TIMEOUT_MS` (25s default; raise to about 90s for codex) and the client timeout follows it | razeef | Accept | A Codex call took 11 to 14s for a tiny plan, so module content can exceed 25s |
| Draft theme "Meadow Glass" replaces SPEC 10's Ink/Paper tokens, pending owner sign-off: Meadow (light, from LangUp: mint to lavender ground, ink pill buttons, Outfit) and Night (dark, from Noryx: ember and cobalt glow, glass cards, thin numerals, highlighter lime for focus). Canvas: https://claude.ai/artifact/NPGo2q3f3m9YUsPAip1Mfi | razeef | Proposed | Owner asked for LangUp's look plus Noryx's glass and gradients |
| Color roles stay the same, hues change: focus = lavender / lime, got it = green / mint, review = blush / ember, always with an icon or a word | razeef | Proposed | Keeps SPEC's meaning-first rule while fitting the new palettes |
| Codex model `gpt-6-luna` with `model_reasoning_effort="low"` | razeef | Accept | The config default `gpt-6.1-sol` is rejected for ChatGPT-account logins; luna was the fastest tested |
