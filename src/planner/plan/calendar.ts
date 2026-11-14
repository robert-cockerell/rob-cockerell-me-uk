// Local dates and slot times in Europe/London (BR-08, BR-09). Slots are built
// as local times, never by adding 30 minutes to a UTC instant.

import { TZDate } from '@date-fns/tz';
import { LONDON } from '../time/london.ts';

/** Staffed hours 07:00–16:30; slots start 07:00 … 16:00 (BR-09, DEC-15). */
export const FIRST_SLOT_MINUTES = 7 * 60;
export const LAST_SLOT_MINUTES = 16 * 60;
export const SLOT_MINUTES = 30;

interface LocalDate {
	year: number;
	month: number; // 1–12
	day: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatLocalDate(d: LocalDate): string {
	return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}

function parseLocalDate(text: string): LocalDate {
	const [year, month, day] = text.split('-').map(Number);
	return { year, month, day };
}

/** The Europe/London calendar date of an instant, as 'YYYY-MM-DD'. */
export function londonDate(at: Date): string {
	const local = new TZDate(at.getTime(), LONDON);
	return formatLocalDate({ year: local.getFullYear(), month: local.getMonth() + 1, day: local.getDate() });
}

/** The instant of a local wall-clock time on a local date. */
export function londonInstant(date: string, minutesFromMidnight: number): Date {
	const { year, month, day } = parseLocalDate(date);
	const hours = Math.floor(minutesFromMidnight / 60);
	const minutes = minutesFromMidnight % 60;
	return new Date(new TZDate(year, month - 1, day, hours, minutes, LONDON).getTime());
}

/** Calendar arithmetic only, on the date itself: no clock, no time zone. */
function weekdayOf(date: string): number {
	const { year, month, day } = parseLocalDate(date);
	return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function addDays(date: string, days: number): string {
	const { year, month, day } = parseLocalDate(date);
	const d = new Date(Date.UTC(year, month - 1, day + days));
	return formatLocalDate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
}

/** BR-09, DEC-45: the next weekday. Friday goes to Monday; bank holidays aren't skipped. */
export function nextStaffedDate(date: string): string {
	let next = addDays(date, 1);
	while (weekdayOf(next) === 0 || weekdayOf(next) === 6) next = addDays(next, 1);
	return next;
}

export interface SlotTimes {
	time: string;
	start: Date;
	end: Date;
}

/** The 19 slots of a local date, each start and end built as local times. */
export function slotTimes(date: string): SlotTimes[] {
	const slots: SlotTimes[] = [];
	for (let m = FIRST_SLOT_MINUTES; m <= LAST_SLOT_MINUTES; m += SLOT_MINUTES) {
		slots.push({
			time: `${pad(Math.floor(m / 60))}:${pad(m % 60)}`,
			start: londonInstant(date, m),
			end: londonInstant(date, m + SLOT_MINUTES),
		});
	}
	return slots;
}
