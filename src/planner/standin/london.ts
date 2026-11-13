// Europe/London conversions for the stand-in, using Intl only (no date library
// could be installed in the T1 session; see docs/analysis/t1-progress.md).
// Instants are always Date (UTC). Local times are strings "YYYY-MM-DD HH:MM".

export const TIME_ZONE = 'Europe/London';

const partsFormat = new Intl.DateTimeFormat('en-GB', {
	timeZone: TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h23',
});

interface LocalParts {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
}

function localParts(instant: Date): LocalParts {
	const out: Record<string, number> = {};
	for (const part of partsFormat.formatToParts(instant)) {
		if (part.type !== 'literal') out[part.type] = Number(part.value);
	}
	return out as unknown as LocalParts;
}

/** Minutes Europe/London is ahead of UTC at this instant: 60 in BST, 0 in GMT. */
export function londonOffsetMinutes(instant: Date): number {
	const p = localParts(instant);
	const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
	const whole = Math.floor(instant.getTime() / 1000) * 1000;
	return Math.round((asUtc - whole) / 60000);
}

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/;

/**
 * Parse a Europe/London local date-time "YYYY-MM-DD HH:MM" (or a date alone,
 * meaning 00:00) into an instant. Returns null if it isn't a real date and time.
 */
export function parseLondonLocal(text: string): Date | null {
	const m = LOCAL_PATTERN.exec(text.trim());
	if (!m) return null;
	const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const [hour, minute] = [Number(m[4] ?? 0), Number(m[5] ?? 0)];
	if (hour > 23 || minute > 59) return null;
	const guess = Date.UTC(year, month - 1, day, hour, minute);
	const check = new Date(guess);
	if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
		return null;
	}
	// Two passes settle the offset either side of a clock change.
	let instant = guess - londonOffsetMinutes(new Date(guess)) * 60000;
	instant = guess - londonOffsetMinutes(new Date(instant)) * 60000;
	return new Date(instant);
}

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

/** "YYYY-MM-DD HH:MM" in Europe/London. */
export function formatLondonLocal(instant: Date): string {
	const p = localParts(instant);
	return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** "YYYY-MM-DD" in Europe/London. */
export function londonDate(instant: Date): string {
	return formatLondonLocal(instant).slice(0, 10);
}

/** ISO 8601 with the Europe/London offset, for example 2026-06-16T09:00:00+01:00. */
export function formatIsoLondon(instant: Date): string {
	const p = localParts(instant);
	const offset = londonOffsetMinutes(instant);
	const sign = offset < 0 ? '-' : '+';
	const abs = Math.abs(offset);
	return (
		`${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` +
		`${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
	);
}

/** "GMT" or "BST" at this instant. */
export function londonZoneName(instant: Date): 'GMT' | 'BST' {
	return londonOffsetMinutes(instant) === 60 ? 'BST' : 'GMT';
}

const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parse a date-time from a query string. ISO 8601 with Z or an offset is taken
 * as given; anything without a zone is read as Europe/London local time, as
 * LibreBooking reads times in the user's own time zone.
 */
export function parseQueryDateTime(text: string): Date | null {
	const trimmed = text.trim();
	if (ISO_WITH_ZONE.test(trimmed)) {
		// Allow +0100 as well as +01:00.
		const normalised = trimmed.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
		const d = new Date(normalised);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	const local = LOCAL_NO_ZONE.exec(trimmed);
	if (!local) return null;
	return parseLondonLocal(local[2] ? `${local[1]} ${local[2]}` : local[1]);
}

const LOCAL_NO_ZONE = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?)?$/;

/** Start of the Europe/London day containing this instant. */
export function startOfLondonDay(instant: Date): Date {
	return parseLondonLocal(londonDate(instant)) as Date;
}

/** Add whole calendar days to a "YYYY-MM-DD" date. */
export function addDays(date: string, days: number): string {
	const [y, m, d] = date.split('-').map(Number);
	const next = new Date(Date.UTC(y, m - 1, d + days));
	return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}
