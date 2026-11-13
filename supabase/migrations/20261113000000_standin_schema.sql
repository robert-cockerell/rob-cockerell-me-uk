-- LibreBooking stand-in: test equipment for the charging planner (T1, DEC-46, DEC-55).
-- Its own schema, `standin`, in the development Supabase project (DEC-58).
-- D1 to D3 are route A's and go in `public`; nothing here refers to them.
--
-- Reached only from the server with the service key. Row level security is on
-- for every table with no policies, and anon and authenticated get nothing.
-- For the Data API to reach it, add `standin` to the exposed schemas
-- (Project settings → Data API). See src/planner/standin/README.md.

create schema if not exists standin;

revoke all on schema standin from public, anon, authenticated;
grant usage on schema standin to service_role;

-- Bookable resources, one per bike (PRD §7.1).
create table standin.resources (
	resource_id integer primary key,
	name text not null,
	status text not null check (status in ('available', 'unavailable', 'hidden'))
);

-- Reservations, with the time the bike was checked in (returned), if it has been.
create table standin.reservations (
	reference_number text primary key,
	resource_id integer not null references standin.resources (resource_id),
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	checked_in_at timestamptz,
	fixture_set text not null,
	constraint reservations_end_after_start check (ends_at > starts_at)
);

create index reservations_resource_idx on standin.reservations (resource_id);

-- Changes testers make during a scenario (stand-in-events.csv). Cleared on reset.
create table standin.events (
	id bigint generated always as identity primary key,
	event_ref text,
	action text not null check (action in ('check in', 'set resource status')),
	resource_id integer not null,
	reservation_ref text,
	value text not null,
	demo_at timestamptz not null,
	applied_at timestamptz not null default now()
);

-- The demo clock: one row. It reads demo_at, plus the time since set_at if running.
create table standin.clock (
	id smallint primary key default 1 check (id = 1),
	demo_at timestamptz not null,
	set_at timestamptz not null,
	running boolean not null default false
);

-- Starts held at Tue 16 June 2026 07:00 BST (SU.06).
insert into standin.clock (id, demo_at, set_at, running)
values (1, '2026-06-16 06:00:00+00', now(), false);

-- Every request to the stand-in's API and clock (NFR-04). Kept across resets.
create table standin.request_log (
	id bigint generated always as identity primary key,
	received_at timestamptz not null,
	demo_at timestamptz,
	method text not null,
	path text not null,
	status integer not null,
	user_agent text
);

create index request_log_demo_at_idx on standin.request_log (demo_at);

alter table standin.resources enable row level security;
alter table standin.reservations enable row level security;
alter table standin.events enable row level security;
alter table standin.clock enable row level security;
alter table standin.request_log enable row level security;

revoke all on all tables in schema standin from public, anon, authenticated;
revoke all on all sequences in schema standin from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema standin to service_role;
grant usage, select on all sequences in schema standin to service_role;
