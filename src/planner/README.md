# Charging planner: running it and putting the public demo on Vercel

Greener Miles is a fictional e-bike library. The planner is route A of a worked example for "Effectively gathering business workflows and information for building systems that work". Everything here (people, fleet, data) is invented.

The rules for building it are in `src/planner/CLAUDE.md`. This file covers the **public, read-only demo** (branch `vercel-demo`).

## What public demo mode does

With `GM_PUBLIC_DEMO=true` (DEC-49, DEC-61):

- every screen opens and every form can be filled in and checked, but choosing save saves nothing and says "This is a demo, so changes aren't saved";
- each reader's demo date and time lives in a cookie, starting at Tue 16 June 2026 07:00, and never moves the shared stand-in clock;
- the tester console is off (404), and the stand-in's request log isn't written to;
- the demo notice shows on every page;
- planner and stand-in pages carry `<meta name="robots" content="noindex">`, and planner and stand-in endpoints send `X-Robots-Tag: noindex`;
- the forecast job does nothing and returns 200, so a pg_cron call left running can't write to D1. Readers only see the scenario dates, which use the recorded forecasts.

The footer shows in every mode. Blog pages are untouched and stay static.

## Production settings (Vercel)

Set these in Vercel, **Production environment only**:

| Name | Value |
|------|-------|
| `GM_PUBLIC_DEMO` | `true` |
| `GM_DEMO_MODE` | `true` |
| `GM_SUPABASE_URL` | the **demo** project's URL |
| `GM_SUPABASE_SERVICE_KEY` | the **demo** project's service role key (mark it sensitive) |
| `GM_LIBREBOOKING_URL` | `https://<production site>/demos/charging-planner/stand-in/api` |
| `GM_FORECAST_JOB_SECRET` | not needed on the demo. Leave it unset |
| `GM_STANDIN_CONSOLE_KEY` | **leave unset** |
| `GM_HANDBOOK_URL` | optional |

Also: Node 22.12 or later (`engines` in `package.json` already asks for it; check Vercel's Node version setting is 22.x or newer). None of these names starts with `PUBLIC_`, and no value goes in git.

**Preview deployments keep Vercel's deployment protection.** Don't switch it off, and don't give previews the demo project's keys.

## A separate demo database

The development project the conference room pilot used must not be touched. The demo gets its own free project.

### 1. Create the project

1. In the Supabase dashboard, choose **New project** on the free plan. Name it for the demo, pick a region, and save the database password somewhere safe.
2. Under **Project settings → API**, note the project URL and the `service_role` key.
3. Under **Project settings → Data API → Exposed schemas**, add `standin` (alongside `public`). The stand-in's tables are in that schema.

### 2. Run the migrations

Use the database connection string rather than `supabase link`, so the CLI's link to the development project (`supabase/.temp/`) stays as it is. Copy the connection string from **Connect** in the dashboard (the session pooler works from any network) and put the password in:

```bash
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres"
```

This applies everything in `supabase/migrations/`. It doesn't apply `supabase/proposed/`.

### 3. Seed it

Put the demo project's URL and service key in `.env` (or the shell), then give the project's ref, which must match the URL. The script refuses otherwise:

```bash
npm run demo:seed -- <project-ref>
```

It loads D1 to D3 and the stand-in from `test-data/`, with the same code as reset R0. Run it again any time to put the demo back to its starting data. Check `GM_SUPABASE_URL` first: this overwrites the planner tables and the stand-in in whichever project it names.

### 4. Point Vercel Production at it

Set the Production variables above, using the demo project's URL and key, then redeploy Production.

### 5. pg_cron

Leave the `gm-forecast-job` pg_cron job **switched off**. `supabase/proposed/20261115000000_forecast_job_cron.sql` is not in `supabase/migrations/`, so `db push` won't create it. Don't move it there for the demo. If a job was ever created on the demo project, unschedule it in the SQL editor:

```sql
select cron.unschedule('gm-forecast-job');
```

Even if a call does arrive, the forecast job returns 200 and writes nothing in public demo mode.

## Local commands

| Script | Runs |
|--------|------|
| `npm run demo:seed -- <ref>` | Load D1 to D3 and the stand-in into the project in `.env` |
| `npm run demo:reset -- <R0\|R1\|R2\|R3\|R3a>` | The CRP resets, as the tester console does |
| `npm run job:forecast` | Run process 1 once (not on the public demo) |
