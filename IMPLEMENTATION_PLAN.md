# LiteCode — Implementation plan

## Architecture and decisions
Next.js App Router / strict TypeScript / Tailwind. Supabase cookie authentication,
normalized PostgreSQL curriculum, owner RLS, server-only grading and atomic rewards.
Separate QuickJS WASM execution service with CPU/heap/worker limits; never evaluate
learner code in Next.js. French original content, all 80 outline IDs retained.
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
- [ ] Install pinned dependencies and configure strict TypeScript, lint, Vitest, Playwright.
- [ ] Create normalized migration, indexes, RLS and transactional completion RPC.
- [ ] Implement email signup/login, confirmation, refresh, protection and account settings.
- [ ] Reusable mobile shell, safe-area navigation, buttons, cards and editor.

## Phase 3 — Screens
- [ ] Welcome, objectives, languages and authentication.
- [ ] Home, path, explanation, editor, results, QCM, blanks, debugging, hints, project.
- [ ] Profile, rankings and preferences. Real empty/loading/error states.

## Phase 4 — Curriculum
- [ ] Author original explanations, examples, questions, distractors and hints for all 80.
- [ ] Author executable JS tests and reference solutions for code/debug/project activities.
- [ ] Validate imports, licensing provenance, prerequisite DAG and reproducible SQL seed.
- [ ] Fetch curriculum dynamically from Supabase; keep grading answers server-only.

## Phase 5 — Learning
- [ ] Server quiz/blank grading, isolated JS adapter and runner with resource limits.
- [ ] Attempts, draft resume, progressive hints and test-driven project steps persist.
- [ ] Prevent locked submissions, forged passes, duplicate XP and concurrent rewards.

## Phase 6 — Gamification
- [ ] Atomic XP/progress, UTC daily streak, event-based achievements and real rankings.
- [ ] Home resume, profile statistics and repeat attempts reflect stored data.

## Phase 7 — Verification and handoff
- [ ] Vitest: import integrity, grading, unlocking, runner success/failure/limits.
- [ ] PostgreSQL integration: RLS, XP deduplication, persistence and prerequisite checks.
- [ ] Playwright: navigation/auth gates and overflow at 375/390/430 px.
- [ ] Compare rendered welcome/onboarding/learning layouts with prototype.
- [ ] Run lint, typecheck, unit/integration tests and production build; fix failures.
- [ ] README, empty .env.example, execution architecture and final evidence report.
- [ ] Commit progressive, reviewed changes; record external checks blocked by empty env.

## Verification commands
`npm run curriculum:build`, `npm run typecheck`, `npm run lint`, `npm test`,
`npm run test:e2e`, `npm run test:db`, `npm run build`.
Database integration must run against a disposable local PostgreSQL/Supabase instance;
browser tests with empty env can prove public UI and configuration/protection states,
but cannot prove live Supabase authentication or persistent user journeys.
