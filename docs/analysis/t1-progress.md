# T1 progress log – test equipment

**Branch:** `t1-test-equipment`
**Started:** 13 November 2026
**Scope:** Stage 0 checks and Stage 1 (`src/planner/CLAUDE.md`): the LibreBooking stand-in, request log, demo clock, tester console, loading and resetting, README.

This log is written by Claude Code. It's the one file under `docs/` it adds; Rob asked for it.

---

## Stage 0: checks

| Check | Result |
|-------|--------|
| `git branch --show-current` | `t1-test-equipment` |
| `npx astro --version` | v7.2.2 (major 7, at least 6): **pass** |
| Commit address | `git config user.email` was refused by the session's permission settings (`.claude/settings.json` denies `git config user.email *`, which seems to catch it). Read the repository's `.git/config` instead: `user.email` is `…@users.noreply.github.com`: **pass** |
| Node | v24.14.0 (22.12 or higher needed) |

Side note: `.git/config` also has a stray key `emailcd = C:\\Users\\…` under `[user]`. It looks like a paste slip. It does no harm, but Rob may want to remove it.

---

## Stage 1: what was done

(Filled in as each piece is committed.)

---

## Blockers

| # | Blocker | Effect | What Rob needs to do |
|---|---------|--------|----------------------|
| B-1 | `npm install` needs approval, and this run is non-interactive, so no library could be added | No `@supabase/supabase-js`, `zod`, `date-fns`, `@date-fns/tz` or `vitest`. The stand-in was built without them (see assumptions A-1 to A-3) | Nothing for T1. Route A will install them |
| B-2 | No server adapter. Astro 7 refuses to build on-demand pages (`prerender = false`) without one (`NoAdapterInstalled`). Adding `@astrojs/vercel` needs an install (B-1) **and** a change to `astro.config.mjs`, which the root `CLAUDE.md` says to ask about first (the planner guide allows it, so the two files disagree) | `npm run build` fails once the stand-in's pages exist. `astro dev` serves them | Approve: `npm install @astrojs/vercel` and add `adapter: vercel()` to `astro.config.mjs` (technical note §2.1, §6.1). Recommended. Also say which CLAUDE.md wins on `astro.config.*` |
| B-3 | `.env` can't be read (denied in `.claude/settings.json`) and `db:push` isn't allowed in this run | The `standin` schema migration is written but not applied, so nothing was run against Supabase. SU.05 and the resets are tested only against the in-memory store | Apply `supabase/migrations/20261113000000_standin.sql`, add `standin` to the exposed schemas (Supabase dashboard → Project settings → Data API), then run `npm run demo:reset -- R0` |

---

## Assumptions

(Filled in as they're made.)

---

## Questions for Rob

(Filled in as they come up.)
