# Charging planner – instructions for Claude Code

Lives at `src/planner/CLAUDE.md`. It's loaded at the start of every session by the line `@src/planner/CLAUDE.md` in the root `CLAUDE.md`. It exists only on the `t1-test-equipment` and `route-a` branches. The root file's site rules still apply.

## What we're building

The Greener Miles charging planner, a proof of concept for Rob's article on gathering business workflows. Staff at a community e-bike library see each half hour of the staffed day with its forecast carbon band, each bike's state and its next booking (**Day plan**). They also keep bike and battery records in one place, including where every battery is (**Fleet**). The tool shows; staff decide. It never says what to charge or when.

**Fictional example.** Greener Miles, its people, fleet, data and depot in Cowley, Oxford (DEC-53) are invented. Never present them as real, and don't add real people, organisations or contact details. The public demo carries the demo notice in UI spec §7.

## Documents

| Path | What it gives you |
|------|-------------------|
| `docs/prd.md` | REQ-01 to REQ-20, business rules BR-01 to BR-12, NFR-01 to NFR-20, screens, sample data (Appendix A), pilot readiness (§9) |
| `docs/analysis/decision-log.md` | DEC-01 to DEC-61. Check it before changing any behaviour |
| `docs/technical-note.md` | Stack, folders (§3), rules (§4.2), demo set-up (§5), technical decisions (§6), environments (§7) |
| `docs/ui-spec.md` | Components C01 to C17, forms, wording, accessibility, the Don't list (§12) |
| `design/reference.html`, `design/planner-theme.scss`, `design/planner-components.scss` | Markup to copy; the theme; the `.gm-` components |
| `docs/analysis/data-dictionary.md` | Formats, mandatory and optional items, empty-value wording (DI-nnn, DF-nn) |
| `docs/analysis/normalisation.md`, `diagrams/lds/logical-data-structure.mmd` | 3NF tables for the schema |
| `docs/analysis/dfds.md`, `diagrams/dfd/*.mmd` | Processes 1, 2 and 3.1 to 3.4 |
| `docs/crp-script.md`, `test-data/*.csv` | Scenarios S1 to S14, fixtures, resets (§3.4) |
| `brand/brand-identity.md`, `brand/tokens.css`, `brand/logo/` | Brand, tokens, logos (§9 is written for you) |
| `docs/article/` | Rob's. Read only the decision traps in `measurement-plan.md` §6.2. Don't edit anything here |

**When documents disagree,** the PRD wins, then the decision log, then the technical note, then the UI spec. The data dictionary, DFDs, CRP script and brand identity give way to the PRD. Don't build on either reading. Tell Rob what each document says, propose following the higher one, and wait.

**The documents are read-only.** Suggest corrections; don't make them. Rob keeps the documents and the decision log.

## Branches and stages

- `main`: the blog, already on Astro 6 or later, with the root `CLAUDE.md`. It's the starting commit for every route. Don't commit to it.
- `t1-test-equipment`: Stage 1 only. It's shared test equipment for all three routes (DEC-46).
- `route-a`: branched from the tip of `t1-test-equipment` (DEC-55). Stages 2 to 5.

Technical note §3.1 sets out the branches. Routes B and C are built on other branches from `main` and never see these documents. Don't merge, rebase or cherry-pick between branches.

At the start of every session, run `git branch --show-current` and work only on that branch's stages. **STOP** means: commit, summarise what you did and anything you're unsure of, then wait for Rob's review.

### Stage 0: checks, every session

- `npx astro --version` must report major version 6 or later. If not, stop. The upgrade is a shared step on `main` (DEC-51, DEC-56), not part of this build.
- Run the root file's commit-address check.

### Stage 1: test equipment (`t1-test-equipment` only)

Sources: technical note §5, PRD §7.1 and §7.2, DEC-26, DEC-27, DEC-29, DEC-55 and CRP script §3. Pages go under `/demos/charging-planner/stand-in/`, code under `src/planner/standin/`, and data in its own `standin` database schema.

1. Stand-in API: two read-only endpoints, resources with status and reservations with start, end and checked-in time. Include earlier reservations that are still running or not checked in (DEC-24).
2. Request log: method, path and time for every request (NFR-04).
3. Demo clock: set it, or leave it running on from a set start.
4. Tester console: set the clock; change a resource's status; add a check-in; load a reservation set; apply the resets and overrides in `resets-and-overrides.csv`; view the request log. It's protected by `GM_STANDIN_CONSOLE_KEY`, switched off when `GM_PUBLIC_DEMO` is on, and never linked from the planner.
5. Loading and resetting the stand-in from `test-data/` as CRP script §3.4 describes. Keep the request log on reset. Make `forecasts.csv` ready to load into D1.
6. Write the stand-in's endpoints and settings in `src/planner/standin/README.md`, so any route's build can be pointed at it.

Done when the stand-in parts of SU.01 to SU.09 and every reset run cleanly. **STOP.**

On `route-a`, Stage 1 is done. Don't change anything under `stand-in/` or `src/planner/standin/` without asking.

### Stage 2: database schema (`route-a`)

- Propose D1, D2 and D3 as one migration in `supabase/migrations/`. Derive it from normalisation (3NF), the logical data structure and the data dictionary's formats and mandatory rules. Add a short note mapping each table and column to its DI-nnn.
- Tables go in the `public` schema of the development Supabase project; the stand-in keeps `standin` (DEC-58). Store instants as `timestamptz`. Switch on row level security for every table, with no policies for the anonymous role.
- Store none of these: a bike status (DEC-01), a fault status (DEC-14), a forecast period end (DEC-13), a battery location (DEC-20).
- Don't push the migration. **STOP** until Rob approves it.
- After approval: run `npm run db:push`, add loading D1 to D3 from `test-data/` to the reset (route A's work, DEC-55), and run SU.05 in full. **STOP.**

### Stage 3: process 2 as a pure module (`route-a`)

Put it in `src/planner/plan/`. It takes resources, reservations, forecasts, open faults and "now", and returns the day plan. It makes no database, network or clock calls. It implements BR-01, BR-03, BR-04, BR-05, BR-08, BR-09, BR-10 and BR-12. Unit tests use the Appendix A data, including both clock-change days and M02's late check-in (DEC-30). **STOP.**

### Stage 4: thin slice of S1 (`route-a`)

Build the day plan's phone timeline end to end at `/demos/charging-planner/`: the clock module, the LibreBooking client, reading D1, process 2, the planner layout with fonts, the header, the name chip and the timeline (C06). Playwright runs S1.01 to S1.10 at 390 × 844. **STOP** so Rob can compare it with `design/reference.html`.

### Stage 5: everything else (`route-a`)

1. The remaining Musts (REQ-01 to REQ-11), including process 1 with pg_cron and pg_net (DEC-48) and public demo mode (`GM_PUBLIC_DEMO`, DEC-49), where each reader's demo date and time lives in a cookie and never moves the shared demo clock (DEC-61). **STOP** when PRD §9 holds.
2. Shoulds (REQ-12 to REQ-16). **STOP.**
3. Coulds (REQ-17 to REQ-19). **STOP.** REQ-20 isn't built.

## Rules – never break these

- **One clock.** All code gets "now" from the `clock` module's `now()`, which reads the demo clock when `GM_DEMO_MODE` is on. Nothing else calls `new Date()` or `Date.now()` for business time (NFR-14). The one exception is `systemNow()`, used only by process 1 to choose which periods to fetch and to stamp Retrieved at, and by the fixture loader for Retrieved at (DEC-59).
- **One time zone rule.** Store instants as `timestamptz`. Convert to Europe/London only when building slots or showing times. Build slots as local times 07:00 to 16:00, never by adding 30 minutes to a UTC instant (BR-08).
- **Read only to LibreBooking.** The client module has no method that creates, changes or deletes anything (NFR-04). No check-out or check-in in the tool (DEC-18).
- **Append-only history.** Fittings and entries are inserted, never updated or deleted, except clearing a fault (BR-07).
- **No status column for bikes.** Process 2 always works out a bike's state (DEC-01).
- **Exact wording.** State names, empty values and messages are word for word as in the PRD, data dictionary and UI spec §5.5, §7 and §8. Keep error messages in one module.
- **Show, don't advise.** Band names only: no gCO₂/kWh figures, no meanings, no advice, no "least bad" slot (DEC-32, AC-01.4).
- **No login, no delete, no status field.** The picked name lives in a cookie and is stamped on changes (technical note §6.3, BR-11). No delete action anywhere (AC-06.5).
- **Recorded forecasts stay.** Process 1 never overwrites D1 periods on the scenario dates in PRD A.1 (DEC-26, DEC-59).
- **Test equipment stays separate.** Planner code reaches the stand-in only through the LibreBooking client's base URL and the clock module.
- **Secrets stay on the server.** Never use `set:html` with stored data. Keep Astro's origin check on (NFR-17, NFR-20).
- Follow the decisions as logged, including the assumed ones (DEC-36 to DEC-43).

## Folders and dependencies

As technical note §3 (DEC-60). You may change: `src/pages/demos/charging-planner/`, `src/planner/`, `supabase/`, `e2e/planner/`, `astro.config.*`, Vercel configuration, `package.json` and its lock file, `playwright.config.ts`, `vitest.config.ts`, `.env.example` and `.gitignore`. Ask before changing anything else.

`docs/`, `design/`, `brand/`, `test-data/` and `diagrams/` are read-only. The one exception: a new `.gm-` component goes in `design/planner-components.scss`, and only after Rob agrees.

Add only the libraries in technical note §2.3: `@supabase/supabase-js`, `date-fns`, `@date-fns/tz`, `zod`, `admin-lte@4` (with the Bootstrap it depends on), `sass`, `vitest`, `@playwright/test`, `@axe-core/playwright` and `supabase` (CLI). No client-side UI framework and no other date library. Copy icons as inline Lucide SVGs from the reference page. Ask before adding anything else.

## Interface

- Copy markup from `design/reference.html` into Astro components. Never copy `.ref-` classes; they're page scaffolding.
- The planner layout loads `brand/tokens.css`, then `design/planner-theme.scss` (Sass load path `node_modules`). Never load AdminLTE's own CSS or any blog CSS, and don't change a theme variable without asking.
- Use the `.gm-` components and the Bootstrap and AdminLTE classes that appear on the reference page, and nothing else (UI spec §1). **Don't invent components.** If a screen needs something the reference page doesn't show, stop and ask.
- Load fonts through Astro's Fonts API with the CSS variables named in `tokens.css` (DEC-51). No Google Fonts link.
- Follow UI spec §12 in full. The ones most often missed: no Bootstrap blue or named colour classes; no toasts, modals or floating labels; no live validation or green ticks; native controls only; no "Submit", "OK" or exclamation marks; sentence case.
- Validate forms on the server with zod, and give every form `novalidate`. Redirect after a save; on failure, keep everything the user typed (NFR-19).

## Definition of done

A requirement is done when:

- every acceptance criterion has a passing test named with its ID, for example `AC-02.3 M02 overdue at 11:30` (NFR-18)
- Playwright runs the scenario steps that test it, as the CRP script gives them, at 360 × 740, 390 × 844, 430 × 932, 1024 × 768 and 1366 × 1024 (NFR-02)
- the axe check (`@axe-core/playwright`) reports no WCAG 2.1 AA failures on the day plan, an asset record, the swap screen and a form showing errors (NFR-03)
- the UI spec §13 checks pass, and NFR-14 to NFR-20 are tested where they can be automated
- `npm run build` passes and the blog pages stay static

Stage 5.1 is done when PRD §9 items 1 to 5 hold. Report what passes, what doesn't, and what Rob must check by hand: NFR-01 taps with one hand, AC-05.7 timing, NFR-07 reading age, NFR-08 on the depot Wi-Fi, and the print.

## Commands

Create these when a stage first needs them (technical note §7.2, DEC-60). pg_cron can't reach this machine, so run process 1 locally with `npm run job:forecast`.

| Script | Runs |
|--------|------|
| `npm run dev` / `npm run build` | The site's existing Astro scripts |
| `npm run test:unit` | `vitest run` |
| `npm run test:e2e` | `playwright test` (the config starts the dev server) |
| `npm test` | Unit tests, then browser tests |
| `npm run theme` | Compile `design/planner-theme.scss` to `design/planner.css` for the reference page. The output isn't committed |
| `npm run db:new -- <name>` | `supabase migration new <name>` |
| `npm run db:push` | `supabase db push`. Only after Rob approves the migration |
| `npm run demo:reset -- <R0\|R1\|R2\|R3\|R3a>` | Reset as CRP script §3.4, using the same code as the console |
| `npm run job:forecast` | Run process 1 once against the local server |

## Environment variables

As technical note §7.1 (DEC-60). Declare them in Astro's env schema (`astro:env`) in the server context, with secrets set to `access: "secret"`. Put the names, but no values, in `.env.example`. The Supabase CLI's own login stays outside `GM_`.

| Name | Holds | Secret |
|------|-------|--------|
| `GM_SUPABASE_URL` | Supabase project URL | No (server only) |
| `GM_SUPABASE_SERVICE_KEY` | Service role key | **Yes** |
| `GM_LIBREBOOKING_URL` | Base URL of the stand-in, later the real API | No |
| `GM_FORECAST_JOB_SECRET` | Shared secret pg_cron sends to the forecast job | **Yes** |
| `GM_STANDIN_CONSOLE_KEY` | Tester console key | **Yes** |
| `GM_DEMO_MODE` | `true`: the clock reads the demo clock | No |
| `GM_PUBLIC_DEMO` | `true`: nothing saved, console off, demo notice shown | No |
| `GM_HANDBOOK_URL` | Charging rules link (AC-16.1, AC-16.2) | No |

## When to stop and ask

Stop and ask Rob, and never quietly decide, when:

- something isn't covered by the documents, or two documents disagree
- a change would alter a logged decision, or anything marked **(proposed)** in the technical note
- you'd add a dependency, touch a file outside the folders above, delete a file, or push or merge
- you'd change the schema after Rob has approved it
- a test fails and the fix would change a requirement's meaning rather than the code

When you ask, name the documents and IDs involved, give the options and recommend one. Don't change a document to make the code fit.
