# Security Policy

## Supported versions

Orbitra is a portfolio app on a single `main` line. Security fixes land on `main` only.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Email the maintainer via the address on the [GitHub profile](https://github.com/bjarkeef) for the `orbitra` repo, or use GitHub’s **private vulnerability reporting** if it is enabled on the repository.

Include:

- A short description of the issue and impact
- Steps to reproduce (or a proof of concept)
- Affected URL / route if relevant (e.g. `/api/tmdb/*`)

You should get an acknowledgement within a few days when possible. Please allow time to investigate before any public disclosure.

## What is in scope

- Exposure of secrets (especially `TMDB_API` or other server env)
- XSS, open redirects, or abuse of Nitro API routes
- Dependency issues with a clear exploit path in this app

## What is out of scope

- TMDB rate limits, catalogue content, or upstream TMDB availability
- Self-hosted misconfiguration (missing env, open preview deploys without protection)
- Feature requests framed as security issues

## Maintainer notes

- `TMDB_API` must stay **server-only** (never `NUXT_PUBLIC_*` or client bundles)
- The `/api/tmdb/*` proxy strips client `api_key` / `include_adult` and forces mainstream catalogue defaults
- Local `.env` is gitignored; only `.env.example` is committed
