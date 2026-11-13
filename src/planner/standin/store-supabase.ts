// The stand-in's store in the development Supabase project, schema `standin`
// (DEC-58). Talks to Supabase's Data API (PostgREST) with fetch, using the
// service key on the server only. Written without @supabase/supabase-js,
// which couldn't be installed in the T1 session; swapping it in later changes
// nothing outside this file.
//
// Needs: supabase/migrations/20261113000000_standin_schema.sql applied, and
// `standin` added to the project's exposed schemas (README.md).

import type {
	ClockState,
	RequestLogEntry,
	Reservation,
	Resource,
	ResourceStatus,
	StandinEvent,
	StandinStore,
} from './types.ts';

export class StandinStoreError extends Error {}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface ResourceRow {
	resource_id: number;
	name: string;
	status: ResourceStatus;
}
interface ReservationRow {
	reference_number: string;
	resource_id: number;
	starts_at: string;
	ends_at: string;
	checked_in_at: string | null;
	fixture_set: string;
}
interface ClockRow {
	id: number;
	demo_at: string;
	set_at: string;
	running: boolean;
}
interface EventRow {
	event_ref: string | null;
	action: StandinEvent['action'];
	resource_id: number;
	reservation_ref: string | null;
	value: string;
	demo_at: string;
	applied_at: string;
}
interface RequestRow {
	received_at: string;
	demo_at: string | null;
	method: string;
	path: string;
	status: number;
	user_agent: string | null;
}

const toResourceRow = (r: Resource): ResourceRow => ({ resource_id: r.resourceId, name: r.name, status: r.status });
const toReservationRow = (r: Reservation): ReservationRow => ({
	reference_number: r.referenceNumber,
	resource_id: r.resourceId,
	starts_at: r.startsAt.toISOString(),
	ends_at: r.endsAt.toISOString(),
	checked_in_at: r.checkedInAt ? r.checkedInAt.toISOString() : null,
	fixture_set: r.fixtureSet,
});

export function createSupabaseStore(options: { url: string; serviceKey: string; fetch?: FetchLike }): StandinStore {
	const base = `${options.url.replace(/\/+$/, '')}/rest/v1/`;
	const doFetch: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));

	async function rest<T>(method: string, path: string, body?: unknown, prefer?: string): Promise<T> {
		const headers: Record<string, string> = {
			apikey: options.serviceKey,
			[method === 'GET' ? 'Accept-Profile' : 'Content-Profile']: 'standin',
		};
		// Legacy service_role keys are JWTs and go in Authorization too; the newer
		// sb_secret_ keys go only in apikey.
		if (options.serviceKey.startsWith('eyJ')) headers.Authorization = `Bearer ${options.serviceKey}`;
		if (body !== undefined) headers['Content-Type'] = 'application/json';
		if (prefer) headers.Prefer = prefer;
		let response: Response;
		try {
			response = await doFetch(base + path, {
				method,
				headers,
				body: body === undefined ? undefined : JSON.stringify(body),
			});
		} catch (error) {
			throw new StandinStoreError(`Can't reach Supabase: ${(error as Error).message}`);
		}
		if (!response.ok) {
			throw new StandinStoreError(`${method} ${path.split('?')[0]} failed: ${response.status} ${await response.text()}`);
		}
		const text = await response.text();
		return (text ? JSON.parse(text) : null) as T;
	}

	return {
		async getClock() {
			const rows = await rest<ClockRow[]>('GET', 'clock?select=*&id=eq.1');
			if (rows.length === 0) throw new StandinStoreError('The demo clock has no row. Apply the standin migration');
			const row = rows[0];
			return { demoAt: new Date(row.demo_at), setAt: new Date(row.set_at), running: row.running };
		},
		async saveClock(state: ClockState) {
			await rest('POST', 'clock?on_conflict=id', {
				id: 1,
				demo_at: state.demoAt.toISOString(),
				set_at: state.setAt.toISOString(),
				running: state.running,
			}, 'resolution=merge-duplicates');
		},
		async listResources() {
			const rows = await rest<ResourceRow[]>('GET', 'resources?select=*&order=resource_id');
			return rows.map((r) => ({ resourceId: r.resource_id, name: r.name, status: r.status }));
		},
		async listReservations() {
			const rows = await rest<ReservationRow[]>('GET', 'reservations?select=*&order=starts_at,reference_number');
			return rows.map((r) => ({
				referenceNumber: r.reference_number,
				resourceId: r.resource_id,
				startsAt: new Date(r.starts_at),
				endsAt: new Date(r.ends_at),
				checkedInAt: r.checked_in_at ? new Date(r.checked_in_at) : null,
				fixtureSet: r.fixture_set,
			}));
		},
		async replaceStandinData(resources, reservations) {
			await rest('DELETE', 'reservations?reference_number=not.is.null');
			await rest('DELETE', 'resources?resource_id=not.is.null');
			if (resources.length) await rest('POST', 'resources', resources.map(toResourceRow));
			if (reservations.length) await rest('POST', 'reservations', reservations.map(toReservationRow));
		},
		async replaceReservations(reservations) {
			await rest('DELETE', 'reservations?reference_number=not.is.null');
			if (reservations.length) await rest('POST', 'reservations', reservations.map(toReservationRow));
		},
		async setResourceStatus(resourceId, status) {
			const rows = await rest<ResourceRow[]>(
				'PATCH',
				`resources?resource_id=eq.${resourceId}`,
				{ status },
				'return=representation',
			);
			return rows.length > 0;
		},
		async setCheckIn(referenceNumber, at) {
			const rows = await rest<ReservationRow[]>(
				'PATCH',
				`reservations?reference_number=eq.${encodeURIComponent(referenceNumber)}`,
				{ checked_in_at: at.toISOString() },
				'return=representation',
			);
			return rows.length > 0;
		},
		async addEvent(e) {
			const row: EventRow = {
				event_ref: e.eventRef,
				action: e.action,
				resource_id: e.resourceId,
				reservation_ref: e.reservationRef,
				value: e.value,
				demo_at: e.demoAt.toISOString(),
				applied_at: e.appliedAt.toISOString(),
			};
			await rest('POST', 'events', row);
		},
		async listEvents() {
			const rows = await rest<EventRow[]>('GET', 'events?select=*&order=id');
			return rows.map((r) => ({
				eventRef: r.event_ref,
				action: r.action,
				resourceId: r.resource_id,
				reservationRef: r.reservation_ref,
				value: r.value,
				demoAt: new Date(r.demo_at),
				appliedAt: new Date(r.applied_at),
			}));
		},
		async clearEvents() {
			await rest('DELETE', 'events?id=not.is.null');
		},
		async appendRequest(e: RequestLogEntry) {
			const row: RequestRow = {
				received_at: e.receivedAt.toISOString(),
				demo_at: e.demoAt ? e.demoAt.toISOString() : null,
				method: e.method,
				path: e.path,
				status: e.status,
				user_agent: e.userAgent,
			};
			await rest('POST', 'request_log', row);
		},
		async listRequests({ sinceDemo, limit }) {
			const since = sinceDemo ? `&demo_at=gte.${encodeURIComponent(sinceDemo.toISOString())}` : '';
			const rows = await rest<RequestRow[]>('GET', `request_log?select=*&order=id.desc&limit=${limit}${since}`);
			return rows.map((r) => ({
				receivedAt: new Date(r.received_at),
				demoAt: r.demo_at ? new Date(r.demo_at) : null,
				method: r.method,
				path: r.path,
				status: r.status,
				userAgent: r.user_agent,
			}));
		},
		async clearRequestLog() {
			await rest('DELETE', 'request_log?id=not.is.null');
		},
	};
}
