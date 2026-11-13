// What the stand-in's two read endpoints return (PRD §7.1, Stage 1 item 1).
//
// Shaped like LibreBooking's web services (/Web/Services/index.php/Resources/
// and /Reservations/) as far as they're known. Field names are unconfirmed
// until Lewis answers A-05 (DEC-27); see README.md for the list to check.

import { formatIsoLondon, parseQueryDateTime, startOfLondonDay, addDays, londonDate, parseLondonLocal } from './london.ts';
import type { Reservation, Resource, ResourceStatus } from './types.ts';

/** LibreBooking's resource status IDs. */
export const STATUS_IDS: Record<ResourceStatus, number> = { hidden: 0, available: 1, unavailable: 2 };

export interface LbResource {
	resourceId: number;
	name: string;
	statusId: number;
}

export interface LbReservation {
	referenceNumber: string;
	resourceId: number;
	resourceName: string;
	startDate: string;
	endDate: string;
	/** When the bike was checked in (returned), or null. See README on LibreBooking's meaning. */
	checkInDate: string | null;
	checkOutDate: null;
}

export function toLbResource(r: Resource): LbResource {
	return { resourceId: r.resourceId, name: r.name, statusId: STATUS_IDS[r.status] };
}

export function toLbReservation(r: Reservation, resourceName: string): LbReservation {
	return {
		referenceNumber: r.referenceNumber,
		resourceId: r.resourceId,
		resourceName,
		startDate: formatIsoLondon(r.startsAt),
		endDate: formatIsoLondon(r.endsAt),
		checkInDate: r.checkedInAt ? formatIsoLondon(r.checkedInAt) : null,
		checkOutDate: null,
	};
}

export interface ReservationQuery {
	start: Date;
	end: Date;
	resourceId: number | null;
}

/** LibreBooking's default window when no dates are given: two weeks from the start of today. */
export const DEFAULT_WINDOW_DAYS = 14;

export type QueryResult = { ok: true; query: ReservationQuery } | { ok: false; message: string };

/**
 * Read `startDateTime`, `endDateTime` and `resourceId` from a query string.
 * Missing dates default to the start of the demo day and two weeks after.
 */
export function parseReservationQuery(params: URLSearchParams, demoNow: Date): QueryResult {
	const startText = params.get('startDateTime');
	const endText = params.get('endDateTime');
	const resourceText = params.get('resourceId');

	const start = startText ? parseQueryDateTime(startText) : startOfLondonDay(demoNow);
	if (!start) return { ok: false, message: `startDateTime isn't a date and time: ${startText}` };
	const end = endText
		? parseQueryDateTime(endText)
		: (parseLondonLocal(addDays(londonDate(start), DEFAULT_WINDOW_DAYS)) as Date);
	if (!end) return { ok: false, message: `endDateTime isn't a date and time: ${endText}` };
	if (end <= start) return { ok: false, message: 'endDateTime must be after startDateTime' };

	let resourceId: number | null = null;
	if (resourceText !== null && resourceText !== '') {
		if (!/^\d+$/.test(resourceText)) return { ok: false, message: `resourceId isn't a whole number: ${resourceText}` };
		resourceId = Number(resourceText);
	}
	return { ok: true, query: { start, end, resourceId } };
}

/**
 * The reservations the stand-in returns for a window:
 *
 * - every reservation that overlaps the window, and
 * - every reservation that started before the window and wasn't checked in
 *   before the window started (DEC-24: "started before today and is either
 *   still running or not checked in"). One checked in after the window
 *   started is included too, so a late check-in can still show as overdue in
 *   the slots before it (DEC-30).
 *
 * Sorted by start, then reference.
 */
export function selectReservations(all: Reservation[], q: ReservationQuery): Reservation[] {
	return all
		.filter((r) => q.resourceId === null || r.resourceId === q.resourceId)
		.filter((r) => {
			const overlaps = r.startsAt < q.end && r.endsAt > q.start;
			const earlierNotBack = r.startsAt < q.start && (r.checkedInAt === null || r.checkedInAt >= q.start);
			return overlaps || earlierNotBack;
		})
		.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.referenceNumber.localeCompare(b.referenceNumber));
}
