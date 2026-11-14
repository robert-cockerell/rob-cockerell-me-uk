// Process 1's two ends: the Carbon Intensity API (read only; nothing about
// staff or members is sent, NFR-11) and D1.

import type { SupabaseClient } from '@supabase/supabase-js';
import { check } from '../db/client.ts';
import type { ApiPeriod, ForecastJobDb } from './job.ts';

const API = 'https://api.carbonintensity.org.uk';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** "2026-06-16T11:30Z", the API's date-time format. */
const apiTime = (d: Date) => `${d.toISOString().slice(0, 16)}Z`;

export function carbonIntensity(fetchFn: FetchLike = (i, o) => fetch(i, o)) {
	return async (from: Date, postcode: string): Promise<{ region: string; periods: ApiPeriod[] }> => {
		const url = `${API}/regional/intensity/${apiTime(from)}/fw48h/postcode/${encodeURIComponent(postcode)}`;
		const res = await fetchFn(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
		if (!res.ok) throw new Error(`Carbon Intensity API answered ${res.status}`);
		const body = (await res.json()) as { data?: unknown };
		// The regional endpoints return the region as an object or a one-item list.
		const region = (Array.isArray(body.data) ? body.data[0] : body.data) as { shortname?: string; data?: ApiPeriod[] } | undefined;
		if (!region?.shortname || !Array.isArray(region.data)) throw new Error('Carbon Intensity API gave no regional forecast');
		return { region: region.shortname, periods: region.data };
	};
}

export function forecastJobDb(db: SupabaseClient): ForecastJobDb {
	return {
		async upsert(rows) {
			const { error } = await db.from('forecast_periods').upsert(rows, { onConflict: 'region,period_start' });
			check('Saving forecast periods', error);
		},
		async listOlderThan(region, cutoff) {
			const { data, error } = await db
				.from('forecast_periods')
				.select('period_start')
				.eq('region', region)
				.lt('period_start', cutoff.toISOString());
			check('Reading old forecast periods', error);
			return (data ?? []).map((r: { period_start: string }) => new Date(r.period_start));
		},
		async delete(region, periodStarts) {
			const { error } = await db
				.from('forecast_periods')
				.delete()
				.eq('region', region)
				.in('period_start', periodStarts.map((d) => d.toISOString()));
			check('Deleting old forecast periods', error);
		},
	};
}
