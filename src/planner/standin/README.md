# LibreBooking stand-in – test equipment

The stand-in plays LibreBooking for the charging planner's demo and its tests (technical note §5, PRD §7.1 and §7.2, DEC-26, DEC-27, DEC-29). It's shared by every route (DEC-46). Any build is pointed at it by setting its LibreBooking base URL and, in demo mode, by reading its demo clock. Nothing else in a build may reach it.

Greener Miles, its fleet and its data are invented. The stand-in's data is synthesised from `test-data/` and is not LibreBooking's.

## Endpoints

All paths are on the site that serves the stand-in: the `t1-test-equipment` Vercel preview, or `astro dev` (`http://localhost:4321`).

| Method | Path | What it gives |
|--------|------|---------------|
| GET, HEAD | `/demos/charging-planner/stand-in/api/Resources/` | Every resource (bike) with its status |
| GET, HEAD | `/demos/charging-planner/stand-in/api/Reservations/` | Reservations in a window, with start, end and checked-in time |
| GET, HEAD | `/demos/charging-planner/stand-in/clock` | The demo date and time now |
| GET, POST | `/demos/charging-planner/stand-in/console` | Tester console (see below). Not part of the API |

**Base URL for a build's LibreBooking client:** `<site>/demos/charging-planner/stand-in/api`. Put it in `GM_LIBREBOOKING_URL`. The client adds `Resources/` or `Reservations/`. Leading and trailing slashes and the case of the path don't matter.

**Read only (NFR-04).** Any method but GET or HEAD gets `405` with `Allow: GET, HEAD` and changes nothing. An unknown path gets `404`. If the stand-in can't reach its store it answers `503`. Every request, refused ones included, is logged (see Request log).

**No authentication.** The stand-in ignores any session or API key headers, so a client written for the real API's headers works unchanged.

### `GET Resources/`

```json
{
  "resources": [
    { "resourceId": 101, "name": "M01", "statusId": 1 }
  ],
  "links": [],
  "message": null
}
```

`statusId` uses LibreBooking's numbers: `0` hidden, `1` available, `2` unavailable.

### `GET Reservations/`

Query parameters, all optional:

| Parameter | Format | Default |
|-----------|--------|---------|
| `startDateTime` | ISO 8601 with `Z` or an offset (`2026-06-16T07:00:00+01:00`), or a local time without a zone (`2026-06-16T07:00`, `2026-06-16 07:00` or `2026-06-16`), read as Europe/London | Start of the demo day, Europe/London |
| `endDateTime` | As `startDateTime` | 14 days after the start date, at 00:00 Europe/London |
| `resourceId` | Whole number | All resources |

A date that isn't real, an end not after the start, or a `resourceId` that isn't a whole number gets `400` with a `message`.

```json
{
  "reservations": [
    {
      "referenceNumber": "R-03",
      "resourceId": 102,
      "resourceName": "M02",
      "startDate": "2026-06-16T09:00:00+01:00",
      "endDate": "2026-06-16T11:00:00+01:00",
      "checkInDate": null,
      "checkOutDate": null
    }
  ],
  "startDateTime": "2026-06-16T00:00:00+01:00",
  "endDateTime": "2026-06-30T00:00:00+01:00",
  "links": [],
  "message": null
}
```

Times are ISO 8601 with the Europe/London offset of that instant (`+01:00` in BST, `+00:00` in GMT). `checkInDate` is when the bike came back, or `null`. `checkOutDate` is always `null`: the tool doesn't use it (DEC-18).

**Which reservations come back (DEC-24, DEC-30):**

- every reservation that overlaps the window, and
- every reservation that started before the window and wasn't checked in before the window started: still running, not checked in, or checked in late during the window. The last kind is kept so the slots before a late check-in can still read overdue (M02, DEC-30).

They're sorted by start, then reference.

### `GET clock`

```json
{
  "now": "2026-06-16T06:00:00.000Z",
  "local": "2026-06-16 07:00",
  "offsetTime": "2026-06-16T07:00:00+01:00",
  "timeZone": "Europe/London",
  "running": false
}
```

A build's `clock` module reads `now` when `GM_DEMO_MODE` is `true` (DEC-26). The clock is either held at a set time or running on from it at real speed. In public demo mode a reader's own date and time live in a cookie and never move this clock (DEC-61); that's the build's job, not the stand-in's.

## Field names still to confirm (A-05, DEC-27, RSK-01)

The shapes above follow LibreBooking's web services as far as they're known. Lewis confirms these against the real API before go-live:

1. The paths `Resources/` and `Reservations/` under `/Web/Services/index.php/`, and how the API key is sent.
2. `statusId` values 0, 1 and 2, and that "hidden" is a status rather than a separate flag.
3. The query parameter names `startDateTime`, `endDateTime` and `resourceId`, and the date format the API accepts and returns.
4. `checkInDate` as the time the bike came back. LibreBooking's own check-in may mean the start of a loan; if so, the field the planner needs is a different one.
5. Whether the real API returns earlier reservations still running or not checked in (DEC-24). The stand-in synthesises them; if the real API can't, the planner needs a fallback (RSK-01).

## Request log (NFR-04)

Every request to the API and the clock is logged with method, path and query, response status, system time received, demo time and user agent. The log is kept across resets except R0, which empties it for the start of a run (SU.05). Testers' own changes through the console aren't API requests and aren't logged here; they're recorded as events.

Read it in the console's **Request log** section, optionally since a demo time (S4.04). After S1 to S14, it should hold no method but GET or HEAD from the tool.

## Tester console

`/demos/charging-planner/stand-in/console`. Never linked from the planner.

- **Protected** by `GM_STANDIN_CONSOLE_KEY`. Type the key once; the browser keeps a hash of it, never the key, in an HTTP-only cookie. With no key set, nobody can open it.
- **Off** when `GM_PUBLIC_DEMO` is `true`, whatever the key.

It can: set the demo clock (to a time, or a row of `demo-clock.csv`), hold it or let it run; apply a reset (R0, R1, R2, R3, R3a) or an override (O-01, O-01r) from `resets-and-overrides.csv`; apply a scenario change from `stand-in-events.csv` (E-01 to E-08); change a resource's status; add a check-in, at a given time or the demo time now; load a reservation set (`main`, `fri-19` or `none`); show what the stand-in serves now; and show the request log.

## Resets (CRP script §3.4)

The console and the command line run the same code (`operations.ts`):

```
npm run demo:reset -- <R0|R1|R2|R3|R3a|O-01|O-01r>
```

| Reset | Stand-in | Clock | D1 to D3 | Request log |
|-------|----------|-------|----------|-------------|
| R0 | Resources and reservation set `main`; no check-ins; events cleared | Left | Reloaded | Emptied |
| R1 | As R0 | Tue 16 June 2026 08:05 | Reloaded | Kept |
| R2 | As R0 | Tue 16 June 2026 16:20 | Reloaded, without entry 1044 | Kept |
| R3 | Resources and reservation set `fri-19` | Fri 19 June 2026 09:00 | Reloaded | Kept |
| R3a | Resources; no reservations | Left | Left | Kept |
| O-01 | – | – | D1: deletes the South England period starting 2026-06-16 14:30Z | – |
| O-01r | – | – | D1: reloads 16 June's 19 periods from `forecasts.csv` | – |

A running clock stays running through a reset. Every fixture file is checked before anything changes; a bad row is refused with its file and row number.

**D1 to D3 belong to the route, not the stand-in.** The reset calls the loader in `src/planner/demo-fixtures.ts` (`plannerFixtures`). On this branch it's `null`, so resets report the D1 to D3 part as not done, and O-01 and O-01r do nothing. Route A sets it once its schema is approved (DEC-55). `forecasts.csv` is parsed and checked into `ForecastFixtureRow`s (UTC period starts, no period end, DEC-13) ready for that loader; Retrieved at is stamped with `systemNow()` (DEC-59).

## Store

The stand-in keeps its data in its own `standin` schema in the development Supabase project (DEC-58): `resources`, `reservations`, `events`, `clock` (one row) and `request_log`. Row level security is on for every table with no policies; only the service role can reach them.

To set it up:

1. Apply `supabase/migrations/20261113000000_standin_schema.sql`.
2. Add `standin` to the exposed schemas: Supabase dashboard → Project settings → Data API.
3. Run `npm run demo:reset -- R0`.

The pages and the reset command use the Supabase store (`store-supabase.ts`). The unit tests use the in-memory store (`store-memory.ts`); it isn't used by the pages.

## Settings

Read on the server only (`env.ts`), from the environment or `.env`. Names are in `.env.example`.

| Name | Used for | Secret |
|------|----------|--------|
| `GM_SUPABASE_URL` | The `standin` store | No (server only) |
| `GM_SUPABASE_SERVICE_KEY` | The `standin` store | **Yes** |
| `GM_STANDIN_CONSOLE_KEY` | Opening the tester console | **Yes** |
| `GM_PUBLIC_DEMO` | `true` switches the console off | No |

Without `GM_SUPABASE_URL` and `GM_SUPABASE_SERVICE_KEY` the API and clock answer `503`.

A build pointed at the stand-in needs:

| Name | Value |
|------|-------|
| `GM_LIBREBOOKING_URL` | `<stand-in site>/demos/charging-planner/stand-in/api` |
| `GM_DEMO_MODE` | `true`, with the build's clock reading `<stand-in site>/demos/charging-planner/stand-in/clock` |

Record what each route needs to point at it (technical note §7, measurement plan §6.1).

## Tests

```
npm run test:unit
```

Runs `*.node-test.ts` with Node's own test runner against the in-memory store and the real files in `test-data/`.
