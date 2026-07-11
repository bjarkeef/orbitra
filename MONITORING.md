# CI monitoring note

Disposable branch to evaluate GitHub Actions CI for `bjarkeef/orbitra` without modifying `main` or deploying.

| Field | Value |
| --- | --- |
| Branch | `chore/monitor-ci-evaluation-20260711` |
| Base commit (pre-note) | `3d3ee099ffbd11d65fd20dd9f8d6e867dd3e101d` |
| Workflow | `CI` (`.github/workflows/ci.yml`) |
| Job | `lint-and-build` |
| Trigger | Draft PR to `main` (workflow has no `workflow_dispatch`) |
| Expected stages | Install (`npm ci`) → Prepare (`npx nuxi prepare`) → Lint → Knip (`knip:ci`) → Typecheck → Build |
| Job timeout | 15 minutes (`timeout-minutes: 15`) |
| Expected duration | ~3–10 minutes typical |
| Start time (UTC) | 2026-07-11T07:39:00Z |
| Run URL / ID | _pending_ |
| End time (UTC) | _pending_ |
| Final state | _pending_ |
| Failing stage | _n/a_ |
| Log URL | _pending_ |

## Notes

- Production deploy is not part of this workflow.
- Build uses placeholder `TMDB_API=ci-placeholder-key` (no real secrets).
- Local WIP on the developer machine is intentionally **not** included in this branch tip for the CI evaluation commit set (only this monitoring note).
