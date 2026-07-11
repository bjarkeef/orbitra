# CI monitoring note

Disposable branch to evaluate GitHub Actions CI for `bjarkeef/orbitra` without modifying `main` or intentionally deploying production.

| Field | Value |
| --- | --- |
| Repo | `bjarkeef/orbitra` |
| Branch | `chore/monitor-ci-evaluation-20260711` |
| PR | [#7](https://github.com/bjarkeef/orbitra/pull/7) (draft; **do not merge**) |
| Commit SHA (evaluated) | `1e8a5376e1d45bd7a5bd478fff0463bfd2d1f18d` |
| Parent / main tip | `3d3ee099ffbd11d65fd20dd9f8d6e867dd3e101d` |
| Workflow | `CI` (`.github/workflows/ci.yml`, workflow id `303530600`) |
| Job | `lint-and-build` (job id `86524537375`) |
| Trigger | `pull_request` to `main` (no `workflow_dispatch` on this workflow) |
| Run ID | `29144854003` |
| Run URL | https://github.com/bjarkeef/orbitra/actions/runs/29144854003 |
| Log / job URL | https://github.com/bjarkeef/orbitra/actions/runs/29144854003/job/86524537375 |
| Start time (UTC) | 2026-07-11T07:39:12Z |
| Job start (UTC) | 2026-07-11T07:39:15Z |
| End time (UTC) | 2026-07-11T07:40:22Z (job) / 2026-07-11T07:40:23Z (run updated) |
| Duration | **1m7s** (job) |
| Final state | **success** (verified via `gh run view` and PR checks, not only the local monitor) |
| Failing stage | _none_ — all stages succeeded |
| Expected stages | Checkout → Setup Node 22 → `npm ci` → `npx nuxi prepare` → `npm run lint` → `npm run knip:ci` → `npm run typecheck` → `npm run build` |
| Job timeout | 15 minutes (`timeout-minutes: 15`) |
| Expected duration | ~1–3 minutes (recent main successes ~1m5s–1m7s) |
| Monitor deadline | ~20 minutes wall clock from start |

## Stage results (from GitHub job steps)

| Stage | Conclusion | Approx. window (UTC) |
| --- | --- | --- |
| Set up job | success | 07:39:16–07:39:18 |
| Checkout | success | 07:39:18–07:39:19 |
| Setup Node | success | 07:39:19–07:39:23 |
| Install (`npm ci`) | success | 07:39:23–07:39:40 |
| Prepare (`npx nuxi prepare`) | success | 07:39:40–07:39:42 |
| Lint (`npm run lint`) | success | 07:39:42–07:39:49 |
| Knip (`npm run knip:ci`) | success | 07:39:49–07:39:50 |
| Typecheck (`npm run typecheck`) | success | 07:39:50–07:40:01 |
| Build (`npm run build`) | success | 07:40:01–07:40:19 |

Annotation (non-failing): GitHub notes that `actions/checkout@v4` and `actions/setup-node@v4` still target Node 20 for the action runtime and are forced onto Node 24 on the runner.

## Confirmed workflow vs docs

Docs (README / ROADMAP) claim CI runs: **prepare → lint → knip → typecheck → build**.

Actual `.github/workflows/ci.yml` job steps match that sequence after install:

1. Checkout (`actions/checkout@v4`)
2. Setup Node 22 + npm cache (`actions/setup-node@v4`)
3. Install: `npm ci`
4. Prepare Nuxt: `npx nuxi prepare` (not an npm script named `prepare`; `postinstall` is `nuxt prepare`)
5. Lint: `npm run lint` → `eslint .`
6. Dead code: `npm run knip:ci` → `knip --no-progress` (docs often say `knip`; CI uses `knip:ci`)
7. Typecheck: `npm run typecheck` → `nuxt typecheck`
8. Build: `npm run build` → `nuxt build` with `TMDB_API=ci-placeholder-key`

Triggers: `push` to `main`, `pull_request` to `main` only. **No** `workflow_dispatch` — this evaluation used a draft PR to fire CI.

## package.json scripts used by CI

| Script | Command | CI? |
| --- | --- | --- |
| `postinstall` | `nuxt prepare` | Indirect via `npm ci` |
| *(explicit)* | `npx nuxi prepare` | Yes |
| `lint` | `eslint .` | Yes |
| `knip:ci` | `knip --no-progress` | Yes |
| `typecheck` | `nuxt typecheck` | Yes |
| `build` | `nuxt build` | Yes |

Node: `engines.node >=20.19.0`; CI pins **Node 22** (ESLint 10 / `Object.groupBy`).

## Safety notes

- No production deploy step in GitHub Actions CI (quality gate only).
- Build uses placeholder `TMDB_API=ci-placeholder-key` (no real TMDB credentials; no `secrets.*` in workflow).
- Only this monitoring note is committed on the disposable branch; local WIP remains uncommitted.
- Opening the draft PR also caused **Vercel** checks (Preview Comments + Vercel deployment completed). That is an external integration side effect of the PR event, not part of `.github/workflows/ci.yml`. No production promote/merge was performed.

## Inspection consensus (orchestrator + explore subagent)

Both independent reads of `.github/workflows/ci.yml`, `package.json`, `eslint.config.mjs`, `knip.config.js`, and docs agree:

- Single workflow file; single job `lint-and-build`.
- No deploy/production job in Actions; production is external (Vercel).
- Docs slightly under-specify install and use `knip` naming vs CI `knip:ci`.
- Related config: ESLint wraps `.nuxt/eslint.config.mjs` (needs prepare); knip ignores `scripts/**` and several devDeps; `nuxt.config.ts` modules include `@nuxt/eslint`.

## Monitor vs GitHub

| Source | Result |
| --- | --- |
| Local monitor (`gh run watch 29144854003`) | exit 0, all steps ✓, job 1m7s |
| Independent `gh run view 29144854003` | `status=completed`, `conclusion=success` |
| `gh pr checks 7` | `lint-and-build` **pass** 1m7s |

**Match:** monitor result matched GitHub’s final status.
