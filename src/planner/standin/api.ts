// The stand-in's HTTP endpoints, as plain functions of a Request so they can be
// unit tested. Every request is logged with method, path and time (NFR-04),
// including ones the stand-in refuses. Read only: anything but GET or HEAD
// gets 405 and changes nothing.

import { demoNow } from './clock.ts';
import { selectReservations, parseReservationQuery, toLbReservation, toLbResource } from './librebooking.ts';
import { formatIsoLondon, formatLondonLocal, TIME_ZONE } from './london.ts';
import type { StandinStore } from './types.ts';

export interface ApiDeps {
	store: StandinStore;
	systemNow: () => Date;
	/** Append each request to the request log (NFR-04). Default true; off on the public demo, so views write nothing. */
	logRequests?: boolean;
}

const READ_METHODS = ['GET', 'HEAD'];

function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
	});
}

function withoutBody(response: Response): Response {
	return new Response(null, { status: response.status, headers: response.headers });
}

async function logged(
	request: Request,
	deps: ApiDeps,
	handle: (demoTime: Date) => Promise<Response>,
): Promise<Response> {
	const receivedAt = deps.systemNow();
	const url = new URL(request.url);
	let demoTime: Date | null = null;
	let response: Response;
	try {
		demoTime = demoNow(await deps.store.getClock(), receivedAt);
		response = await handle(demoTime);
	} catch (error) {
		console.error('[stand-in]', error);
		response = json(503, { message: 'The stand-in can\'t reach its data store' });
	}
	try {
		if (deps.logRequests !== false) await deps.store.appendRequest({
			receivedAt,
			demoAt: demoTime,
			method: request.method.toUpperCase(),
			path: url.pathname + url.search,
			status: response.status,
			userAgent: request.headers.get('user-agent'),
		});
	} catch (error) {
		console.error('[stand-in] request not logged', error);
	}
	return request.method.toUpperCase() === 'HEAD' ? withoutBody(response) : response;
}

function readOnly(): Response {
	return json(405, { message: 'The stand-in is read only' }, { Allow: READ_METHODS.join(', ') });
}

/**
 * The LibreBooking stand-in API. `subpath` is what follows the API base URL:
 * `Resources/` or `Reservations/`, with or without slashes.
 */
export function handleApi(request: Request, subpath: string, deps: ApiDeps): Promise<Response> {
	return logged(request, deps, async (demoTime) => {
		if (!READ_METHODS.includes(request.method.toUpperCase())) return readOnly();
		const route = subpath.replace(/^\/+|\/+$/g, '').toLowerCase();

		if (route === 'resources') {
			const resources = await deps.store.listResources();
			return json(200, { resources: resources.map(toLbResource), links: [], message: null });
		}

		if (route === 'reservations') {
			const parsed = parseReservationQuery(new URL(request.url).searchParams, demoTime);
			if (!parsed.ok) return json(400, { message: parsed.message });
			const [resources, reservations] = await Promise.all([deps.store.listResources(), deps.store.listReservations()]);
			const names = new Map(resources.map((r) => [r.resourceId, r.name]));
			const selected = selectReservations(reservations, parsed.query);
			return json(200, {
				reservations: selected.map((r) => toLbReservation(r, names.get(r.resourceId) ?? '')),
				startDateTime: formatIsoLondon(parsed.query.start),
				endDateTime: formatIsoLondon(parsed.query.end),
				links: [],
				message: null,
			});
		}

		return json(404, { message: `The stand-in has no endpoint ${subpath || '/'}. Use Resources/ or Reservations/` });
	});
}

/** The demo clock, read by a build's clock module in demo mode (DEC-26). */
export function handleClock(request: Request, deps: ApiDeps): Promise<Response> {
	return logged(request, deps, async (demoTime) => {
		if (!READ_METHODS.includes(request.method.toUpperCase())) return readOnly();
		const state = await deps.store.getClock();
		return json(200, {
			now: demoTime.toISOString(),
			local: formatLondonLocal(demoTime),
			offsetTime: formatIsoLondon(demoTime),
			timeZone: TIME_ZONE,
			running: state.running,
		});
	});
}
