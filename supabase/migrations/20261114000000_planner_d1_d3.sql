-- Charging planner: data stores D1 to D3 (route A, Stage 2).
-- Derived from docs/analysis/normalisation.md §8 (3NF), the logical data
-- structure (diagrams/lds/logical-data-structure.mmd v0.2) and the data
-- dictionary's formats and mandatory rules. Column to DI-nnn mapping:
-- supabase/schema-notes.md.
--
-- Tables live in `public` of the development Supabase project; the stand-in
-- keeps `standin` (DEC-58). Instants are timestamptz; conversion to
-- Europe/London happens in the app only (BR-08).
--
-- Not stored, by decision: a bike status (DEC-01), a fault status (DEC-14),
-- a forecast period end (DEC-13), a battery location (DEC-20).
--
-- Reached only from the server with the service key. Row level security is
-- on for every table with no policies, and anon and authenticated get nothing.
--
-- Checks that depend on "now" ("not in the future") aren't here: business
-- time is the demo clock, which the database can't see (NFR-14). The app
-- validates them with zod.

-- ---------------------------------------------------------------------------
-- D1 Forecasts
-- ---------------------------------------------------------------------------

create table public.forecast_periods (
	region text not null
		check (char_length(btrim(region)) between 1 and 30),
	period_start timestamptz not null
		-- On the hour or half hour (DI-001). Epoch arithmetic keeps it zone-free.
		check (extract(epoch from period_start)::bigint % 1800 = 0),
	forecast_intensity integer not null
		check (forecast_intensity between 0 and 999),
	index_band text not null
		check (index_band in ('very low', 'low', 'moderate', 'high', 'very high')),
	retrieved_at timestamptz not null,
	primary key (region, period_start)
);

comment on table public.forecast_periods is
	'D1 Forecast period. Period end is period_start + 30 minutes, never stored (DEC-13).';

-- ---------------------------------------------------------------------------
-- D2 Bikes and batteries
-- ---------------------------------------------------------------------------

create table public.bikes (
	bike_asset_tag text primary key
		check (bike_asset_tag ~ '^[A-Z][0-9]{2}$'),
	librebooking_resource_id integer not null unique
		check (librebooking_resource_id > 0),
	make text not null
		check (char_length(btrim(make)) between 1 and 30),
	model text not null
		check (char_length(btrim(model)) between 1 and 40),
	frame_size text
		check (frame_size is null or char_length(btrim(frame_size)) between 1 and 10),
	bike_serial_number text unique
		check (bike_serial_number is null or char_length(btrim(bike_serial_number)) between 1 and 30),
	bike_purchase_date date,
	last_updated_by text not null
		check (char_length(btrim(last_updated_by)) between 1 and 50),
	last_updated_at timestamptz not null
		check (last_updated_at = date_trunc('minute', last_updated_at))
);

comment on table public.bikes is
	'D2 Bike. No status column: availability is LibreBooking''s, bike state is derived by process 2 (DEC-01).';

create table public.battery_types (
	battery_type text primary key
		check (char_length(btrim(battery_type)) between 1 and 40),
	capacity integer
		check (capacity is null or capacity between 1 and 2000)
);

comment on table public.battery_types is 'D2 Battery type. No charge times (DEC-08).';

create table public.batteries (
	battery_asset_tag text primary key
		check (battery_asset_tag ~ '^B-[0-9]{2}$'),
	battery_type text not null
		references public.battery_types (battery_type) on update cascade,
	bosch_serial text unique
		check (bosch_serial is null or char_length(btrim(bosch_serial)) between 1 and 20),
	battery_purchase_date date,
	cycle_count integer
		check (cycle_count is null or cycle_count between 0 and 9999),
	last_updated_by text not null
		check (char_length(btrim(last_updated_by)) between 1 and 50),
	last_updated_at timestamptz not null
		check (last_updated_at = date_trunc('minute', last_updated_at))
);

comment on table public.batteries is
	'D2 Battery. No status or location: quarantine is an open fault (DEC-09), location is derived (DEC-20).';

create index batteries_battery_type_idx on public.batteries (battery_type);

-- Append-only history of where each battery is. A row with no bike records a
-- removal (DEC-20). No compatibility or duplicate checks (DEC-06).
create table public.fittings (
	battery_asset_tag text not null
		references public.batteries (battery_asset_tag),
	fitted_from timestamptz not null
		check (fitted_from = date_trunc('minute', fitted_from)),
	bike_asset_tag text
		references public.bikes (bike_asset_tag),
	recorded_by text not null
		check (char_length(btrim(recorded_by)) between 1 and 50),
	recorded_at timestamptz not null
		check (recorded_at = date_trunc('minute', recorded_at)),
	primary key (battery_asset_tag, fitted_from)
);

comment on table public.fittings is
	'D2 Fitting. Insert only (BR-07). bike_asset_tag null = battery removed (DEC-20).';

create index fittings_bike_asset_tag_idx on public.fittings (bike_asset_tag, fitted_from desc);

-- ---------------------------------------------------------------------------
-- D3 Service and fault log
-- ---------------------------------------------------------------------------

create table public.entries (
	-- Sequential, never reused (DI-021). "By default" so fixtures keep their IDs.
	entry_id bigint generated by default as identity primary key,
	entry_type text not null
		check (entry_type in ('service check', 'dealer service', 'fault')),
	entry_date date not null,
	bike_asset_tag text
		references public.bikes (bike_asset_tag),
	battery_asset_tag text
		references public.batteries (battery_asset_tag),
	description text not null
		check (char_length(btrim(description)) between 1 and 500),
	recorded_by text not null
		check (char_length(btrim(recorded_by)) between 1 and 50),
	recorded_at timestamptz not null
		check (recorded_at = date_trunc('minute', recorded_at)),
	cleared_date date,
	cleared_by text
		check (cleared_by is null or char_length(btrim(cleared_by)) between 1 and 50),
	-- Exactly one of bike or battery (normalisation §8, DF Asset reference).
	constraint entries_one_asset
		check (num_nonnulls(bike_asset_tag, battery_asset_tag) = 1),
	-- Cleared date and Cleared by: faults only, both or neither (DI-027, DI-028).
	constraint entries_cleared_pair
		check ((cleared_date is null) = (cleared_by is null)),
	constraint entries_cleared_faults_only
		check (entry_type = 'fault' or cleared_date is null),
	constraint entries_cleared_after_entry
		check (cleared_date is null or cleared_date >= entry_date)
);

comment on table public.entries is
	'D3 Service or fault entry. Insert only, except clearing a fault (BR-07). Fault status is derived from cleared_date (DEC-14).';

create index entries_bike_asset_tag_idx on public.entries (bike_asset_tag);
create index entries_battery_asset_tag_idx on public.entries (battery_asset_tag);
-- Open faults: DF-20, DF-24, DF-25.
create index entries_open_faults_idx on public.entries (entry_id)
	where entry_type = 'fault' and cleared_date is null;

-- ---------------------------------------------------------------------------
-- Append-only history (BR-07), enforced as well as followed in the app.
-- TRUNCATE doesn't fire row triggers, so the demo reset below still works.
-- ---------------------------------------------------------------------------

create function public.fittings_insert_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	raise exception 'Fittings are insert only (BR-07)';
end;
$$;

create trigger fittings_insert_only
	before update or delete on public.fittings
	for each row execute function public.fittings_insert_only();

create function public.entries_insert_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	if tg_op = 'DELETE' then
		raise exception 'Entries are never deleted (BR-07)';
	end if;

	-- The one allowed update: clearing an open fault.
	if old.cleared_date is not null
		or new.cleared_date is null
		or (new.entry_id, new.entry_type, new.entry_date, new.bike_asset_tag,
			new.battery_asset_tag, new.description, new.recorded_by, new.recorded_at)
			is distinct from
			(old.entry_id, old.entry_type, old.entry_date, old.bike_asset_tag,
			old.battery_asset_tag, old.description, old.recorded_by, old.recorded_at)
	then
		raise exception 'Only clearing an open fault may change an entry (BR-07)';
	end if;

	return new;
end;
$$;

create trigger entries_insert_only
	before update or delete on public.entries
	for each row execute function public.entries_insert_only();

-- ---------------------------------------------------------------------------
-- Demo reset (CRP script §3.4, DEC-55). One call replaces D2 and D3 with the
-- fixture rows and upserts the recorded forecasts into D1, in one
-- transaction. The app reads test-data/, converts local times to instants
-- and stamps retrieved_at with systemNow() (DEC-59) before calling it.
-- Keys in `payload`: forecast_periods, battery_types, bikes, batteries,
-- fittings, entries; each an array of rows named as the columns.
-- ---------------------------------------------------------------------------

create function public.reset_planner_data(payload jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
	truncate public.fittings, public.entries, public.batteries, public.bikes, public.battery_types;

	insert into public.battery_types
	select * from jsonb_populate_recordset(null::public.battery_types, coalesce(payload -> 'battery_types', '[]'));

	insert into public.bikes
	select * from jsonb_populate_recordset(null::public.bikes, coalesce(payload -> 'bikes', '[]'));

	insert into public.batteries
	select * from jsonb_populate_recordset(null::public.batteries, coalesce(payload -> 'batteries', '[]'));

	insert into public.fittings
	select * from jsonb_populate_recordset(null::public.fittings, coalesce(payload -> 'fittings', '[]'));

	insert into public.entries overriding system value
	select * from jsonb_populate_recordset(null::public.entries, coalesce(payload -> 'entries', '[]'));

	-- New entries carry on after the highest fixture ID.
	perform setval(
		pg_get_serial_sequence('public.entries', 'entry_id'),
		coalesce((select max(entry_id) from public.entries), 0) + 1,
		false
	);

	insert into public.forecast_periods
	select * from jsonb_populate_recordset(null::public.forecast_periods, coalesce(payload -> 'forecast_periods', '[]'))
	on conflict (region, period_start) do update set
		forecast_intensity = excluded.forecast_intensity,
		index_band = excluded.index_band,
		retrieved_at = excluded.retrieved_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access: server only, through the service key.
-- ---------------------------------------------------------------------------

alter table public.forecast_periods enable row level security;
alter table public.bikes enable row level security;
alter table public.battery_types enable row level security;
alter table public.batteries enable row level security;
alter table public.fittings enable row level security;
alter table public.entries enable row level security;

revoke all on public.forecast_periods, public.bikes, public.battery_types,
	public.batteries, public.fittings, public.entries
	from public, anon, authenticated;
revoke all on sequence public.entries_entry_id_seq from public, anon, authenticated;
revoke all on function public.reset_planner_data(jsonb) from public, anon, authenticated;
revoke all on function public.fittings_insert_only() from public, anon, authenticated;
revoke all on function public.entries_insert_only() from public, anon, authenticated;

grant select, insert, update, delete on public.forecast_periods, public.bikes,
	public.battery_types, public.batteries, public.fittings, public.entries
	to service_role;
-- For reset_planner_data only.
grant truncate on public.bikes, public.battery_types, public.batteries,
	public.fittings, public.entries
	to service_role;
-- update: setval in reset_planner_data.
grant usage, select, update on sequence public.entries_entry_id_seq to service_role;
grant execute on function public.reset_planner_data(jsonb) to service_role;
