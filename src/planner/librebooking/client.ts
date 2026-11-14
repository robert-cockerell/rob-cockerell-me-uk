// The LibreBooking client. Read only (NFR-04): it has no method that creates,
// changes or deletes anything, and sends only GET. No check-out or check-in
// in the tool (DEC-18). Its base URL is GM_LIBREBOOKING_URL: the stand-in
// now, the real API after Lewis confirms the field names (A-05).

import type { PlanReservation, PlanResource, ResourceStatus } from '../plan/types.ts';

export interface LibreBookingClient {
	getResources(): Promise<PlanResource[]>;
	/** Reservations in the window, plus earlier ones still running or not checked in (DEC-24). */
	getReservations(window: { start: Date; end: Date }): Promise<PlanReservation[]>;
}

export class LibreBookingError extends Error {}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** LibreBooking's status numbers (stand-in README; to confirm, A-05). */
const STATUS: Record<number, ResourceStatus> = { 0: 'hidden', 1: 'available', 2: 'unavailable' };

interface ResourcesBody {
	resources?: { resourceId?: unknown; statusId?: unknown }[];
}
interface ReservationsBody {
	reservations?: { resourceId?: unknown; startDate?: unknown; endDate?: unknown; checkInDate?: unknown }[];
}

function instant(value: unknown, field: string): Date {
	const d = typeof value === 'string' ? new Date(value) : null;
	if (!d || Number.isNaN(d.getTime())) throw new LibreBookingError(`LibreBooking gave an invalid ${field}`);
	return d;
}

function wholeNumber(value: unknown, field: string): number {
	const n = typeof value === 'string' ? Number(value) : value;
	if (typeof n !== 'number' || !Number.isInteger(n)) throw new LibreBookingError(`LibreBooking gave an invalid ${field}`);
	return n;
}

export function createLibreBookingClient(options: { baseUrl: string; fetch?: FetchLike; timeoutMs?: number }): LibreBookingClient {
	const base = options.baseUrl.trim().replace(/\/+$/, '');
	const doFetch: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));

	async function get<T>(path: string): Promise<T> {
		let res: Response;
		try {
			res = await doFetch(`${base}/${path}`, {
				method: 'GET',
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
			});
		} catch (error) {
			throw new LibreBookingError(`LibreBooking can't be reached: ${(error as Error).message}`);
		}
		if (!res.ok) throw new LibreBookingError(`LibreBooking answered ${res.status} for ${path}`);
		return (await res.json()) as T;
	}

	return {
		async getResources() {
			const body = await get<ResourcesBody>('Resources/');
			return (body.resources ?? []).map((r) => {
				const status = STATUS[wholeNumber(r.statusId, 'statusId')];
				if (!status) throw new LibreBookingError('LibreBooking gave an unknown statusId');
				return { resourceId: wholeNumber(r.resourceId, 'resourceId'), status };
			});
		},

		async getReservations({ start, end }) {
			const query = new URLSearchParams({ startDateTime: start.toISOString(), endDateTime: end.toISOString() });
			const body = await get<ReservationsBody>(`Reservations/?${query}`);
			return (body.reservations ?? []).map((r) => ({
				resourceId: wholeNumber(r.resourceId, 'resourceId'),
				start: instant(r.startDate, 'startDate'),
				end: instant(r.endDate, 'endDate'),
				checkedInAt: r.checkInDate == null ? null : instant(r.checkInDate, 'checkInDate'),
			}));
		},
	};
}
