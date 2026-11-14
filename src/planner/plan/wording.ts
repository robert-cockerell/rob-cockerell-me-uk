// The day plan's words, exactly as UI spec §4 (C02 to C05) and §8, the PRD
// (BR-01, BR-03, BR-10) and the data dictionary (DI-030, DI-041). Bands only:
// no figures, meanings or advice (DEC-32, AC-01.5).

import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { LONDON } from '../time/london.ts';
import { londonDate } from './calendar.ts';
import type { BikeState, IndexBand } from './types.ts';

/** C03 Bike state label. */
export const STATE_LABELS: Record<BikeState, string> = {
	'out of service': 'Out of service',
	'in the workshop': 'In the workshop',
	'out on loan': 'Out on loan',
	overdue: 'Overdue – not checked in',
};

/** C05 Flags and warnings. */
export const OPEN_FAULT_LABEL = 'Open fault';
export const RESOURCE_MISMATCH_LABEL = "Resource ID doesn't match LibreBooking";
/** C04 and C17. */
export const NO_BOOKING = 'No booking';
/** C02 and C17. */
export const NO_FORECAST = 'No forecast';

const local = (at: Date) => new TZDate(at.getTime(), LONDON);

/** "13:30", 24-hour, UK local time (BR-08). */
export function localTime(at: Date): string {
	return format(local(at), 'HH:mm');
}

/** "Wed 13:00". */
function dayAndTime(at: Date): string {
	return format(local(at), 'EEE HH:mm');
}

/** C02 Band tag text. */
export function bandLabel(band: IndexBand | null): string {
	return band ?? NO_FORECAST;
}

/** DI-030 with an overdue state: "due 11:00" today, "due Mon 16:30" on an earlier day (DEC-24). */
export function dueLabel(dueAt: Date, planDate: string): string {
	return `due ${londonDate(dueAt) === planDate ? localTime(dueAt) : dayAndTime(dueAt)}`;
}

/** C04, BR-03: "next out: 14:00", "next out: Wed 13:00" or "No booking". */
export function nextBookingLabel(nextBooking: Date | null, planDate: string): string {
	if (!nextBooking) return NO_BOOKING;
	return `next out: ${londonDate(nextBooking) === planDate ? localTime(nextBooking) : dayAndTime(nextBooking)}`;
}

/** C05, BR-05: "Booked again at 14:00". */
export function bookedAgainLabel(at: Date): string {
	return `Booked again at ${localTime(at)}`;
}
