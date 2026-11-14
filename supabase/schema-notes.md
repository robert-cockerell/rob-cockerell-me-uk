# Schema notes – D1 to D3 (route A, Stage 2)

Migration: `supabase/migrations/20261114000000_planner_d1_d3.sql`. **Proposed, not pushed.** It waits for Rob's approval before `npm run db:push`.

Sources: normalisation §8 (3NF relations), `diagrams/lds/logical-data-structure.mmd` v0.2, data dictionary v0.6 §2 (formats, mandatory rules) and §3.1 (stored structures). All tables are in `public`; the stand-in keeps `standin` (DEC-58).

## Tables and columns

| Table | Structure (dictionary §3.1) | Column | DI | Type and rule in the database |
|-------|-----------------------------|--------|----|-------------------------------|
| `forecast_periods` | D1 Forecast period | `region` | DI-003 | text, 1–30 chars; key part |
| | | `period_start` | DI-001 | timestamptz; key part; on the hour or half hour |
| | | `forecast_intensity` | DI-004 | integer 0–999 |
| | | `index_band` | DI-005 | very low, low, moderate, high, very high |
| | | `retrieved_at` | DI-006 | timestamptz, mandatory |
| `bikes` | D2 Bike | `bike_asset_tag` | DI-007 | text, key; one capital letter and two digits |
| | | `librebooking_resource_id` | DI-008 | integer > 0, unique (candidate key) |
| | | `make` | DI-009 | text, 1–30 chars |
| | | `model` | DI-010 | text, 1–40 chars |
| | | `frame_size` | DI-011 | text, optional, up to 10 chars |
| | | `bike_serial_number` | DI-012 | text, optional, up to 30 chars, unique when present |
| | | `bike_purchase_date` | DI-013 | date, optional |
| | | `last_updated_by` | DI-038 | text, 1–50 chars |
| | | `last_updated_at` | DI-039 | timestamptz, to the minute |
| `battery_types` | D2 Battery type | `battery_type` | DI-016 | text, key, 1–40 chars |
| | | `capacity` | DI-019 | integer 1–2,000 Wh, optional |
| `batteries` | D2 Battery | `battery_asset_tag` | DI-014 | text, key; `B-` and two digits |
| | | `battery_type` | DI-016 | FK to `battery_types`, mandatory |
| | | `bosch_serial` | DI-015 | text, optional, up to 20 chars, unique when present |
| | | `battery_purchase_date` | DI-017 | date, optional |
| | | `cycle_count` | DI-018 | integer 0–9,999, optional |
| | | `last_updated_by` | DI-038 | text, 1–50 chars |
| | | `last_updated_at` | DI-039 | timestamptz, to the minute |
| `fittings` | D2 Fitting | `battery_asset_tag` | DI-014 | FK to `batteries`; key part |
| | | `fitted_from` | DI-020 | timestamptz, to the minute; key part |
| | | `bike_asset_tag` | DI-007 | FK to `bikes`, optional: null means removed (DEC-20) |
| | | `recorded_by` | DI-025 | text, 1–50 chars |
| | | `recorded_at` | DI-037 | timestamptz, to the minute |
| `entries` | D3 Service or fault entry | `entry_id` | DI-021 | bigint identity, key; sequential, never reused |
| | | `entry_type` | DI-022 | service check, dealer service, fault |
| | | `entry_date` | DI-023 | date, mandatory |
| | | `bike_asset_tag` | DI-007 | FK to `bikes`; exactly one of this and `battery_asset_tag` |
| | | `battery_asset_tag` | DI-014 | FK to `batteries`; exactly one of this and `bike_asset_tag` |
| | | `description` | DI-024 | text, 1–500 chars |
| | | `recorded_by` | DI-025 | text, 1–50 chars |
| | | `recorded_at` | DI-037 | timestamptz, to the minute |
| | | `cleared_date` | DI-027 | date; faults only; with `cleared_by`; on or after `entry_date` |
| | | `cleared_by` | DI-028 | text up to 50 chars; faults only; with `cleared_date` |

"1–n chars" means mandatory and not blank once trimmed. The lengths are the dictionary's **(invented)** limits.

## Not stored

| Item | DI | Decision | Worked out from |
|------|----|----------|-----------------|
| Bike status | – | DEC-01 | LibreBooking resource status and reservations (process 2) |
| Fault status | DI-026 | DEC-14 | `cleared_date` null = open |
| Period end | DI-002 | DEC-13 | `period_start` + 30 minutes |
| Battery location, Quarantined | DI-040, DI-036 | DEC-20, DEC-09 | Latest fitting and open battery faults |

## Also in the migration

- **Append-only history (BR-07), enforced in the database.** Triggers reject any update or delete on `fittings`, and any delete on `entries`. The one update they allow on `entries` is clearing an open fault: setting `cleared_date` and `cleared_by` with nothing else changed. The app follows the same rule; the triggers are a second line.
- **`reset_planner_data(payload jsonb)`.** One call, one transaction: it empties D2 and D3, loads the fixture rows, moves the entry ID sequence past the highest fixture ID, and upserts the recorded forecasts into D1. TRUNCATE doesn't fire the row triggers, so the reset still works. The app converts the fixtures' local times to instants and stamps `retrieved_at` with `systemNow()` (DEC-59) before calling it. It's here so loading D1 to D3 after approval doesn't need a second schema change.
- **Access.** RLS is on for every table, with no policies. `anon` and `authenticated` have no grants on the tables, the sequence or the functions; only `service_role` does.

## Not checked in the database

- **"Not in the future"** (DI-006, DI-013, DI-017, DI-020, DI-023, DI-027, DI-037, DI-039). Business time is the demo clock (NFR-14), which the database can't see, so the app checks these with zod.
- **Asset tag already in use** and the other uniqueness rules *are* in the database, but the app checks them first so it can show the UI spec's wording.

## Choices for Rob

| # | Choice | Proposed | Alternative |
|---|--------|----------|-------------|
| S-1 | Bike asset tag format | Any capital letter and two digits, so a new bike family needs no schema change | Only M, G and D, as DI-007 lists today |
| S-2 | Changing an asset tag after it's used | Refused once a fitting or entry refers to it, because fittings and entries are append only. Renaming a battery type carries through to its batteries | Allow renames by cascading into fittings and entries. This breaks BR-07's "never updated" |
| S-3 | Two fittings of one battery in the same minute | Refused, because battery and Fitted from are the key (normalisation §8) | Add seconds to Fitted from. DI-020 says "to the minute" |
| S-4 | BR-07 triggers and the reset function | In this migration | Leave both out: the app follows BR-07 on its own, and the reset deletes through the Data API |

## Pushing

`npm run db:push` applies every pending migration. That includes T1's `20261113000000_standin_schema.sql` (blocker B-3), which hasn't been applied yet. Once it's pushed, add `standin` to the exposed schemas (Project settings → Data API).

## How it was checked

Both migrations were applied to PGlite (Postgres 16 in WebAssembly), with roles shaped like Supabase's (`service_role` bypasses RLS), and loaded with the `test-data/` fixtures: 3 battery types, 18 bikes, 26 batteries, 18 fittings, 5 entries and 80 forecast periods. Then 34 checks ran: the reset run twice; a new entry getting ID 1045; clearing fault 1043 once, but not twice; every BR-07 refusal; the exactly-one-asset rule; validation cases V-02 to V-04, V-09, V-11 and V-20; a swap and a removal; a refused tag rename; removing the 15:30 forecast and getting it back on reset; and anon refused on tables and functions. All passed. Nothing has been run against the Supabase project.
