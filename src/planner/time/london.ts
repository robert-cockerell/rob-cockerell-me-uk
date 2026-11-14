// Europe/London conversions. Instants are stored as timestamptz; local time is
// used only when building slots or showing times (BR-08).

import { TZDate } from '@date-fns/tz';

export const LONDON = 'Europe/London';

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;

/**
 * "YYYY-MM-DD HH:MM" in UK local time (data dictionary §1) to an instant.
 * Returns null if the text isn't in that form or isn't a real date and time.
 */
export function parseLondonLocal(text: string): Date | null {
	const m = LOCAL_DATE_TIME.exec(text.trim());
	if (!m) return null;
	const [year, month, day, hour, minute] = m.slice(1).map(Number);
	if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
	const local = new TZDate(year, month - 1, day, hour, minute, LONDON);
	// Reject rolled-over dates such as 31 June.
	if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day) return null;
	return new Date(local.getTime());
}
