// The one clock (NFR-14, technical note §4.2). All business time comes from
// now(): the stand-in's demo clock when GM_DEMO_MODE is on (DEC-26), the
// system clock otherwise. Recorded at, Last updated at and Fitted from all
// use it. Nothing else reads the system clock for business time.
//
// Public demo readers' own clocks (DEC-61) are Stage 5.

import { systemNow } from './system-now.ts';

export interface Clock {
	now(): Promise<Date>;
}

export class ClockError extends Error {}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * The stand-in serves its clock beside its API: `<site>/…/stand-in/api` →
 * `<site>/…/stand-in/clock` (src/planner/standin/README.md). Null if the base
 * URL isn't the stand-in's.
 */
export function demoClockUrl(librebookingUrl: string | undefined): string | null {
	if (!librebookingUrl) return null;
	const base = librebookingUrl.trim().replace(/\/+$/, '');
	return /\/api$/i.test(base) ? base.replace(/\/api$/i, '/clock') : null;
}

export function createClock(options: { demoMode: boolean; librebookingUrl?: string; fetch?: FetchLike }): Clock {
	if (!options.demoMode) return { now: async () => systemNow() };

	const url = demoClockUrl(options.librebookingUrl);
	const doFetch: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
	return {
		async now() {
			if (!url) throw new ClockError('GM_DEMO_MODE is on, but GM_LIBREBOOKING_URL doesn\'t end in /api, so the demo clock can\'t be found');
			const res = await doFetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
			if (!res.ok) throw new ClockError(`Demo clock answered ${res.status}`);
			const body = (await res.json()) as { now?: unknown };
			const at = typeof body.now === 'string' ? new Date(body.now) : null;
			if (!at || Number.isNaN(at.getTime())) throw new ClockError('Demo clock gave no valid "now"');
			return at;
		},
	};
}
