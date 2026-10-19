# LiteCode — Implementation plan

> Archive du plan initial, rédigé avant la refonte pédagogique et le retrait du runner
> (étape 6, 2026-10-19). Ses phases, cases cochées et preuves sont historiques et ne
> constituent pas la checklist active du rework. Pour l’état courant et ses limites,
> voir `IMPLEMENTATION_REPORT.md`, `docs/EXECUTION.md` et le ledger
> `docs/plans/learning-rework-progress.md`.

## Architecture and decisions
Next.js App Router / strict TypeScript / Tailwind. Supabase cookie authentication,
normalized PostgreSQL curriculum, owner RLS, server-only grading and atomic rewards.
Décision initiale depuis remplacée : l’étape 6 a retiré le service d’exécution JavaScript.
Les activités structurées sont corrigées côté serveur, sans exécuter le code apprenant.
French original content, all 80 outline IDs retained.
Prototype tokens/layout/SVG mascot retained; no gallery controls or fake phone status.
The user authorizes sequential implementation in this checkout and empty env values.
No remote project mutation or deployment. No third-party educational bodies imported.

## Phase 1 — Research
- [x] Inspect empty checkout and seven supplied files; preserve originals under references/.
- [x] Parse full JSON documents: 80 metadata records, 80 matching manifest paths,
  10 modules and 80 sequential original outlines; no lesson bodies or portable tests.
- [x] Analyze prototype's 16 renderers, CSS, SVG and simulated interactions.
- [x] Review schema and importer: source rights are separate from software license.
- [x] Define architecture, implementation order and verification boundaries here.

## Phase 2 — Foundation
- [x] Install pinned dependencies and configure strict TypeScript, lint, Vitest, Playwright.
- [x] Create normalized migration, indexes, RLS and transactional completion RPC.
- [x] Implement email signup/login, confirmation, refresh, protection and account settings.
- [x] Reusable mobile shell, safe-area navigation, buttons, cards and editor.

## Phase 3 — Screens
- [x] Welcome, objectives, languages and authentication.
- [x] Home, path, explanation, editor, results, QCM, blanks, debugging, hints, project.
- [x] Profile, rankings and preferences. Real empty/loading/error states.

## Phase 4 — Curriculum
- [x] Author original explanations, examples, questions, distractors and hints for all 80.
- [x] Author executable JS tests and reference solutions for code/debug/project activities.
- [x] Validate imports, licensing provenance, prerequisite DAG and reproducible SQL seed.
- [x] Fetch curriculum dynamically from Supabase; keep grading answers server-only.

## Phase 5 — Learning
- [x] Initial grading and runner implementation; runtime removed at step 6.
- [x] Attempts, draft resume, progressive hints and test-driven project steps persist.
- [x] Prevent locked submissions, forged passes, duplicate XP and concurrent rewards.

## Phase 6 — Gamification
- [x] Atomic XP/progress, UTC daily streak, event-based achievements and real rankings.
- [x] Home resume, profile statistics and repeat attempts reflect stored data.

## Phase 7 — Verification and handoff
- [x] Historical Vitest: import integrity and runner checks (those tests were removed at step 6).
- [x] PostgreSQL integration: RLS, XP deduplication, persistence and prerequisite checks.
- [x] Playwright: navigation/auth gates and overflow at 375/390/430 px.
- [x] Compare rendered welcome/onboarding layouts with prototype.
- [ ] Compare authenticated learning screens with live Supabase data; blocked by empty configuration.
- [x] Run lint, typecheck, unit/integration tests and production build; fix failures.
- [x] README, empty .env.example, execution architecture and final evidence report.
- [x] Commit progressive, reviewed changes; record external checks blocked by empty env.

## Verification commands
`npm run curriculum:build`, `npm run typecheck`, `npm run lint`, `npm test`,
`npm run test:e2e`, `npm run test:db`, `npm run build`.
Database integration runs in embedded PostgreSQL (PGlite); authenticated acceptance
requires a separate hosted Supabase test project explicitly selected by its reference;
browser tests with empty env can prove public UI and configuration/protection states,
but cannot prove live Supabase authentication or persistent user journeys.

## Final evidence from the initial MVP
14 Vitest tests and 27 PostgreSQL checks pass. Public browser tests: 12 pass,
3 authenticated live cases intentionally unexecuted. Typecheck, lint, build and
npm audit pass. See IMPLEMENTATION_REPORT.md for exact boundaries.

- [ ] Historical gate: run authenticated end-to-end acceptance after configuring Supabase.
- [ ] Verify a physical iPhone after infrastructure setup; no runner host is required now.

These gates remain open; this checklist does not assert full Definition of Done.
