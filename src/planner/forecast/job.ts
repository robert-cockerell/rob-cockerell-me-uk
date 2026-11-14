// Process 1 Fetch forecast (DFD process 1, DEC-48). Fetches the Carbon
// Intensity API's regional forecast for the depot's postcode and upserts each
// half-hour period into D1 by region and period start (DEC-13: no period end).
//
// Uses the real system clock, never the demo clock: to choose which periods to
// fetch and to stamp Retrieved at (DEC-59). Never writes or deletes periods on
// the scenario dates (PRD A.1, DEC-26). Keeps 30 days of forecasts (NFR-10),
// apart from the scenario dates (agreed by Rob, 14 November 2026).

import { londonDate } from '../plan/calendar.ts';
import type { IndexBand } from '../plan/types.ts';

/** The depot is in Cowley (DEC-44, DEC-53). */
export const DEPOT_POSTCODE = 'OX4';

/** PRD A.1: dates whose forecasts come only from test-data/forecasts.csv. */
export const SCENARIO_DATES = new Set([
	'2026-06-16', // main demo day
	'2026-06-17', // its next staffed day
	'2026-06-19', // AC-03.6
	'2026-06-22', // its next staffed day
	'2026-12-08', // S9
	'2026-03-30', // S14, BST
	'2026-10-26', // S14, GMT
]);

export const RETENTION_DAYS = 30;

const BANDS: IndexBand[] = ['very low', 'low', 'moderate', 'high', 'very high'];

export interface ApiPeriod {
	from: string;
	intensity?: { forecast?: number | null; index?: string | null };
}

export interface ForecastPeriodRow {
	region: string;
	period_start: string;
	forecast_intensity: number;
	index_band: IndexBand;
	retrieved_at: string;
}

export interface ForecastJobDb {
	upsert(rows: ForecastPeriodRow[]): Promise<void>;
	/** Period starts older than the cutoff, for the region. */
	listOlderThan(region: string, cutoff: Date): Promise<Date[]>;
	delete(region: string, periodStarts: Date[]): Promise<void>;
}

export interface ForecastJobReport {
	region: string;
	received: number;
	saved: number;
	skippedScenarioDates: number;
	skippedNoForecast: number;
	deletedOld: number;
}

export async function runForecastJob(deps: {
	fetchForecast: (from: Date, postcode: string) => Promise<{ region: string; periods: ApiPeriod[] }>;
	db: ForecastJobDb;
	systemNow: () => Date;
}): Promise<ForecastJobReport> {
	const now = deps.systemNow();
	// The API takes a start to the half hour; start at the current period.
	const from = new Date(Math.floor(now.getTime() / 1_800_000) * 1_800_000);
	const { region, periods } = await deps.fetchForecast(from, DEPOT_POSTCODE);
	const retrievedAt = new Date(Math.floor(now.getTime() / 60_000) * 60_000).toISOString();

	const rows: ForecastPeriodRow[] = [];
	let skippedScenarioDates = 0;
	let skippedNoForecast = 0;
	for (const p of periods) {
		const start = new Date(p.from);
		const forecast = p.intensity?.forecast;
		const band = p.intensity?.index as IndexBand | undefined;
		if (Number.isNaN(start.getTime()) || start.getTime() % 1_800_000 !== 0) continue;
		if (SCENARIO_DATES.has(londonDate(start))) {
			skippedScenarioDates++;
			continue;
		}
		// No forecast or band: the period isn't stored; the slot reads "No forecast" (DI-004, DI-005).
		if (typeof forecast !== 'number' || !Number.isInteger(forecast) || forecast < 0 || forecast > 999 || !band || !BANDS.includes(band)) {
			skippedNoForecast++;
			continue;
		}
		rows.push({ region, period_start: start.toISOString(), forecast_intensity: forecast, index_band: band, retrieved_at: retrievedAt });
	}
	if (rows.length) await deps.db.upsert(rows);

	const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 3_600_000);
	const old = (await deps.db.listOlderThan(region, cutoff)).filter((d) => !SCENARIO_DATES.has(londonDate(d)));
	if (old.length) await deps.db.delete(region, old);

	return { region, received: periods.length, saved: rows.length, skippedScenarioDates, skippedNoForecast, deletedOld: old.length };
}
