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

/** "14:00" on the plan date, "Wed 13:00" on another day. */
export function whenFromPlanDate(at: Date, planDate: string): string {
	return londonDate(at) === planDate ? localTime(at) : dayAndTime(at);
}

/** DI-030 with an overdue state: "due 11:00" today, "due Mon 16:30" on an earlier day (DEC-24). */
export function dueLabel(dueAt: Date, planDate: string): string {
	return `due ${whenFromPlanDate(dueAt, planDate)}`;
}

/** C04: the words before the time. */
export const NEXT_OUT = 'next out:';

/** C04, BR-03: "next out: 14:00", "next out: Wed 13:00" or "No booking". */
export function nextBookingLabel(nextBooking: Date | null, planDate: string): string {
	if (!nextBooking) return NO_BOOKING;
	return `${NEXT_OUT} ${whenFromPlanDate(nextBooking, planDate)}`;
}

/** Page heading date, UI spec §8.2: "Tue 16 Jun". */
export function planDateHeading(planDate: string): string {
	const [y, m, d] = planDate.split('-').map(Number);
	return format(new TZDate(y, m - 1, d, 12, 0, LONDON), 'EEE d MMM');
}

/** Timeline slot with no bike changing (C06). */
export const NO_CHANGES = 'No changes';
/** Count on a closed timeline slot (C06, DEC-78): the 07:00 slot lists every bike. */
export const allBikes = (n: number): string => (n === 1 ? '1 bike' : `All ${n} bikes`);
/** Count on a closed timeline slot (C06, DEC-78): later slots list the bikes that change. */
export const bikesChange = (n: number): string => (n === 1 ? '1 bike changes' : `${n} bikes change`);
/** C18 band chart's summary (DEC-80). */
export const CARBON_FORECAST = 'Carbon forecast';
/** Day plan views on phones (DEC-82). */
export const VIEW_REST_OF_DAY = 'Rest of day';
export const VIEW_ALL_DAY = 'All day';
/** "Rest of day" once the staffed day is over (DEC-82). */
export const NOTHING_MORE_TODAY = 'Nothing more today';
/** Bikes in and out now, on phones (DEC-81). */
export const BIKES_IN = 'Bikes in';
export const BIKES_OUT = 'Bikes out';
/** C17 link out (REQ-16). */
export const CHARGING_RULES = 'Charging rules';
/** C16 problem notice when LibreBooking can't be reached (PRD §7.3). */
export const BOOKINGS_DOWN = {
	title: "Bookings can't be loaded",
	body: "LibreBooking isn't answering, so bike states aren't shown. Fleet records still work.",
	retry: 'Try again',
};

/** C05, BR-05: "Booked again at 14:00". */
export function bookedAgainLabel(at: Date): string {
	return `Booked again at ${localTime(at)}`;
}
