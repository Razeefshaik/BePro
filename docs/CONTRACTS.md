# BePro: contracts

Version 1.0.0. Full definitions are in `SPEC.md`; this file says where each interface lives and who uses it. Changes need owner approval: update `SPEC.md` first, bump this version, and add a line to `docs/DECISIONS.md`.

| Interface | Defined in | Code | Used by |
| --- | --- | --- | --- |
| Response envelope and error codes | SPEC 4 | `server/index.js`, `src/api/client.js` | server, client |
| Endpoints `/api/plan`, `/api/module`, `/api/readmore`, `/api/doubt` | SPEC 4 | `server/routes/*` | `src/api/client.js` |
| Learning profile | SPEC 5 | `shared/profile.js` | prompts, validator, UI |
| Plan, ModuleContent, Card, Visual, Question, ReadMore schemas | SPEC 6 | `shared/schemas.js` | pipeline, client safeParse |
| Session state shape and actions | SPEC 9 | `src/state/sessionReducer.js` | screens |
| localStorage key `highlight.sessions.v1` | SPEC 9 | `src/state/persistence.js` | App |
