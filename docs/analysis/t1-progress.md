# T1 progress log – test equipment

**Branch:** `t1-test-equipment`
**Started:** 13 November 2026
**Scope:** Stage 0 checks and Stage 1 (`src/planner/CLAUDE.md`): the LibreBooking stand-in, request log, demo clock, tester console, loading and resetting, README.

This log is written by Claude Code. It's the one file under `docs/` it adds; Rob asked for it.

## Runs

| Run | Date | What happened |
|-----|------|---------------|
| 1 | 13 November 2026 | Built most of Stage 1. Stopped when the usage limit ran out, before anything was committed or this log's assumptions and what-was-done sections were filled in. Rob committed the work as a WIP snapshot (`91544ea`), then added the Vercel adapter (`5df79ca`, DEC-62) |
| 2 | 13 November 2026 | **Resumed run**, because run 1 stopped part way. Rebuilt the assumptions and what-was-done sections below from the code in `91544ea`, as Rob asked; fixed the unit tests run 1 left failing; wrote the README. The build now fails for a reason outside the stand-in (B-4), and `git add` needs approval in this session, so run 2's changes are not committed (B-5) |

---

## Stage 0: checks

| Check | Run 1 | Run 2 |
|-------|-------|-------|
| `git branch --show-current` | `t1-test-equipment` | `t1-test-equipment` |
| `npx astro --version` | v7.2.2: **pass** | v7.4.12: **pass**. Astro moved from 7.2.2 to 7.4.12 when Rob installed `@astrojs/vercel` (`5df79ca`); `package.json` still says `^7.2.2` |
| Commit address | `git config user.email` refused by the permission settings; read `.git/config` instead: `…@users.noreply.github.com`: **pass** | Same method, same result: **pass** |
| Node | v24.14.0 (22.12 or higher needed) | – |

Side note from run 1: `.git/config` had a stray key `emailcd = C:\\Users\\…` under `[user]`. It's no longer there in run 2.

---

## Stage 1: what was done

### Run 1 (rebuilt from commit `91544ea`)

| Stage 1 item | Where | What it does |
|--------------|-------|--------------|
| 1. Stand-in API | `src/planner/standin/api.ts`, `librebooking.ts`; page `src/pages/demos/charging-planner/stand-in/api/[...path].ts` | `GET`/`HEAD` `Resources/` (status as LibreBooking IDs 0, 1, 2) and `Reservations/` (start, end, checked-in time, ISO 8601 with the London offset). Window from `startDateTime`/`endDateTime`, default the demo day plus 14 days; optional `resourceId`. Returns overlapping reservations plus earlier ones not checked in before the window started (DEC-24), keeping late check-ins so earlier slots can read overdue (DEC-30). Anything but GET or HEAD gets 405 (NFR-04) |
| 2. Request log | `api.ts` (`logged`), `standin.request_log` | Every API and clock request, refused ones too: method, path and query, status, system time, demo time, user agent. Kept across resets except R0 |
| 3. Demo clock | `clock.ts`; page `stand-in/clock.ts` | Pure functions: set, hold, run on from a set start. Endpoint serves `now`, local time, offset time and whether it's running |
| 4. Tester console | `stand-in/console.astro`, `console-access.ts`, `console-actions.ts`, `ConsoleLayout.astro` | Key from `GM_STANDIN_CONSOLE_KEY`, kept as a hash in an HTTP-only cookie; off when `GM_PUBLIC_DEMO` is `true`. Sets the clock (time or `demo-clock.csv` row; hold or run); applies resets and overrides; applies E-01 to E-08; changes a resource's status; adds a check-in; loads a reservation set; shows current data and the request log, optionally since a demo time. Own layout and styles, nothing from the blog or the planner |
| 5. Loading and resetting | `operations.ts`, `fixtures.ts`, `csv.ts`, `fixture-files.ts`, `cli/reset.ts`; `src/planner/demo-fixtures.ts` | R0, R1, R2, R3, R3a, O-01, O-01r as CRP script §3.4, one set of functions for the console and `npm run demo:reset`. Every fixture file is checked before anything changes. `forecasts.csv` is parsed into UTC period starts with no period end (DEC-13), ready for D1. D1 to D3 go through the `plannerFixtures` seam in `demo-fixtures.ts`, `null` on this branch, so those parts report "not done" until route A fills it in (DEC-55) |
| Store | `types.ts`, `store-memory.ts`, `store-supabase.ts`; `supabase/migrations/20261113000000_standin_schema.sql` | `standin` schema (DEC-58): `resources`, `reservations`, `events`, `clock` (one row, starts held at 16 June 07:00 BST), `request_log`. Instants are `timestamptz`; RLS on, no policies; only `service_role` granted. In-memory store for the tests |
| Time zone | `london.ts`, `system-time.ts` | Europe/London conversions, both clock-change days; `systemNow()` the one place system time is read |
| Settings | `env.ts`, `runtime.ts`, `.env.example` | Server-only settings; names for every `GM_` variable in `.env.example`, no values |
| Tests | `standin.node-test.ts`, `london.node-test.ts`, `test-support.ts`; scripts `test:unit`, `test:unit:standin`, `demo:reset` in `package.json` | 48 tests against the in-memory store and the real `test-data/` files |

### Run 2

| Piece | Status |
|-------|--------|
| Build check | Server entrypoints, including every stand-in page, build with the Vercel adapter. Prerendering then fails on the blog's `/about` (B-4). Not caused by the stand-in |
| Unit tests | 5 of 48 failed at the start of run 2. All were slips in the tests, not in the stand-in: `forecasts.csv` has 80 periods (19 + 19 + 21 + 21), not 81 (two tests); two regexes looked for "route A" where the message says "Route A"; the NFR-04 test's clock request had no user agent. Fixed; **48 of 48 pass**. Also corrected a comment in `demo-fixtures.ts` that named a `resets.ts` that doesn't exist |
| 6. README | `src/planner/standin/README.md`: endpoints, query parameters and response shapes, which reservations come back, the clock, field names for Lewis to confirm (A-05), request log, console, resets table, store set-up, settings, what a route's build needs to point at it, tests. Examples checked against `test-data/` |
| Commits | None: B-5 |

### SU.01 to SU.09, stand-in parts

| Step | Stand-in part | Status |
|------|---------------|--------|
| SU.01 | Stand-in running; a build can read bookings from it and today from its clock | Endpoints and clock tested against the in-memory store. Not run against Supabase (B-3). Pointing a build at it: README |
| SU.04 | The stand-in's own schema isn't the build's data; nothing to inspect | – |
| SU.05 | Load R0: stand-in resources and reservation set `main`, no events, request log empty | Passes against the in-memory store. D1 to D3 reported "not done" (route A's loader, DEC-55) |
| SU.06 | Clock set to Tue 16 June 2026 07:00 | Passes against the in-memory store |
| SU.02, SU.03, SU.07 to SU.09 | No stand-in part | – |

Every reset and override (R0, R1, R2, R3, R3a, O-01, O-01r) has a passing unit test against the in-memory store, O-01 and O-01r with a recording stand-in for route A's loader.

---

## Blockers

| # | Blocker | Effect | What Rob needs to do |
|---|---------|--------|----------------------|
| B-1 | No package could be installed in run 1 or run 2 | No `@supabase/supabase-js`, `zod`, `date-fns`, `@date-fns/tz` or `vitest`. Built without them (A-1 to A-4) | Nothing for T1. Route A installs them |
| B-2 | No server adapter | **Resolved** by Rob in `5df79ca` (DEC-62) | – |
| B-3 | The `standin` migration isn't applied and the schema isn't exposed | Nothing has run against Supabase. SU.05 and the resets are tested only against the in-memory store. The console, API and clock pages answer 503 without Supabase settings | **Open.** Apply `supabase/migrations/20261113000000_standin_schema.sql`, add `standin` to the exposed schemas (Supabase dashboard → Project settings → Data API), then run `npm run demo:reset -- R0` |
| B-4 | `5df79ca` replaced `astro.config.mjs` with the adapter template, whose comments ("your existing site, integrations etc. stay as they are") were pasted in literally. The blog's `site`, `integrations: [mdx(), sitemap()]` and the Atkinson `fonts` block are gone | **`npm run build` fails**: `/about` throws `Invalid URL` in `BaseHead.astro` because `Astro.site` is undefined. Pushing this would also drop the sitemap and the blog's font | Approve restoring the config as it was before `5df79ca`, plus `adapter: vercel()` (Q-1). DEC-62 allows the adapter line only, so run 2 hasn't touched it |
| B-5 | `git add` needs approval in this session | Run 2's changes are in the working tree, not committed | Commit them, or approve `git add` and `git commit` for the next run (Q-2) |

---

## Assumptions

A-1 to A-3 were made in run 1 and rebuilt in run 2 from the code in `91544ea`. A-4 and A-5 were also in run 1's code but not logged; run 2 adds them.

| # | Assumption | Where | To undo |
|---|------------|-------|---------|
| A-1 | Without `@supabase/supabase-js` (B-1), the Supabase store talks to the Data API (PostgREST) with `fetch` and the service key, on the server only | `store-supabase.ts` | Swap in `@supabase/supabase-js`; nothing outside that file changes |
| A-2 | Without `date-fns` and `@date-fns/tz` (B-1), Europe/London conversions use `Intl.DateTimeFormat` only, with unit tests on both clock-change days (S14) | `london.ts`, `london.node-test.ts` | Replace with `@date-fns/tz` behind the same functions |
| A-3 | Without `vitest` (B-1), unit tests use Node's own test runner on `*.node-test.ts`, with Node's built-in TypeScript type stripping. `npm run test:unit` runs them through `test:unit:standin`, so route A can point `test:unit` at `vitest run` and keep these | `*.node-test.ts`, `package.json` | Move to Vitest when it's installed: the tests use `describe`, `it` and `assert`, so they port almost unchanged |
| A-4 | Without `zod` (B-1), the tester console checks its form fields by hand. It's test equipment, not a planner form, so the planner's form rules (UI spec, NFR-19) aren't applied to it | `console-actions.ts` | Use `zod` if wanted |
| A-5 | Technical note §7.1 asks for settings in Astro's env schema (`astro:env`), which needs a change to `astro.config.mjs` beyond the adapter (DEC-62). The stand-in reads them in one server-only module from `process.env`, then `import.meta.env` under `astro dev` | `env.ts` | Declare them in `astro:env` once Rob agrees to the config change, and read them there |

---

## Questions for Rob

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q-1 | B-4: may I restore `astro.config.mjs`? Root `CLAUDE.md` says ask before changing it; DEC-62 allows only the adapter line | (a) Restore the pre-`5df79ca` file (`site`, `mdx()`, `sitemap()`, Atkinson fonts) and add `import vercel from '@astrojs/vercel'` and `adapter: vercel()`. (b) Rob does it | (a): nothing new, it puts back what the template dropped. Then rerun `npm run build` and check the blog pages still prerender. While it's open, A-5 could be settled too by adding the `GM_` env schema (technical note §7.1), but that's a separate approval |
| Q-2 | B-5: commit run 2's changes | (a) Rob commits. (b) Approve `git add` and `git commit` for the next run | Either. Suggested message: "Fix stand-in unit tests, add stand-in README, update T1 log" |
| Q-3 | `package.json` still says `"astro": "^7.2.2"` while 7.4.12 is installed | (a) Leave it: the lock file pins 7.4.12. (b) Raise the range to `^7.4.12` | (a). It's a dependency change, so it's Rob's call |

---

## Stage 1 status

Stage 1's code is complete and its unit tests pass against the in-memory store. It isn't **done** by the planner guide's definition until:

1. `npm run build` passes and the blog pages prerender (B-4, Q-1)
2. the stand-in parts of SU.05 and SU.06 and every reset run against Supabase (B-3)
3. run 2's changes are committed (B-5)
