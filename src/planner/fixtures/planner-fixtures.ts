// Route A's loader for D1 to D3 (DEC-55), behind the seam in ../demo-fixtures.ts.
// It reads the D2 and D3 fixture files, checks every row against the data
// dictionary's formats before anything changes, converts UK local times to
// instants (BR-08) and hands the lot to reset_planner_data, which replaces D2
// and D3 and upserts D1 in one transaction.

import { z } from 'zod';
import type { ForecastFixtureRow, PlannerFixtures } from '../demo-fixtures.ts';
import { parseLondonLocal } from '../time/london.ts';
import { parseCsv } from './csv.ts';

/** The D2 and D3 fixture files' text, keyed by name. */
export interface PlannerFixtureTexts {
	batteryTypes: string;
	bikes: string;
	batteries: string;
	fittings: string;
	entries: string;
}

export const PLANNER_FIXTURE_FILES: Record<keyof PlannerFixtureTexts, string> = {
	batteryTypes: 'battery-types.csv',
	bikes: 'bikes.csv',
	batteries: 'batteries.csv',
	fittings: 'fittings.csv',
	entries: 'entries.csv',
};

// ------------------------------------------------------------ row formats

const text = (max: number) => z.string().max(max);
const optionalText = (max: number) => z.string().max(max).nullable();
const wholeNumber = (min: number, max: number) =>
	z
		.string()
		.regex(/^\d+$/, 'must be a whole number')
		.transform(Number)
		.pipe(z.number().min(min).max(max));
const optionalWholeNumber = (min: number, max: number) => wholeNumber(min, max).nullable();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const localDateTime = z.string().transform((value, ctx) => {
	const at = parseLondonLocal(value);
	if (!at) {
		ctx.addIssue({ code: 'custom', message: 'must be YYYY-MM-DD HH:MM in UK local time' });
		return z.NEVER;
	}
	return at.toISOString();
});
const bikeTag = z.string().regex(/^[A-Z][0-9]{2}$/, 'must be a capital letter and two digits');
const batteryTag = z.string().regex(/^B-[0-9]{2}$/, 'must be B- and two digits');

const batteryTypeRow = z.object({
	battery_type: text(40),
	capacity: optionalWholeNumber(1, 2000),
});
const bikeRow = z.object({
	bike_asset_tag: bikeTag,
	librebooking_resource_id: wholeNumber(1, 2_147_483_647),
	make: text(30),
	model: text(40),
	frame_size: optionalText(10),
	bike_serial_number: optionalText(30),
	bike_purchase_date: date.nullable(),
	last_updated_by: text(50),
	last_updated_at: localDateTime,
});
const batteryRow = z.object({
	battery_asset_tag: batteryTag,
	battery_type: text(40),
	bosch_serial: optionalText(20),
	battery_purchase_date: date.nullable(),
	cycle_count: optionalWholeNumber(0, 9999),
	last_updated_by: text(50),
	last_updated_at: localDateTime,
});
const fittingRow = z.object({
	battery_asset_tag: batteryTag,
	fitted_from: localDateTime,
	bike_asset_tag: bikeTag.nullable(),
	recorded_by: text(50),
	recorded_at: localDateTime,
});
// `source` in entries.csv says where a row came from; it isn't loaded.
const entryRow = z.object({
	entry_id: wholeNumber(1, Number.MAX_SAFE_INTEGER),
	entry_type: z.enum(['service check', 'dealer service', 'fault']),
	entry_date: date,
	bike_asset_tag: bikeTag.nullable(),
	battery_asset_tag: batteryTag.nullable(),
	description: text(500),
	recorded_by: text(50),
	recorded_at: localDateTime,
	cleared_date: date.nullable(),
	cleared_by: optionalText(50),
});

export type BatteryTypeRow = z.output<typeof batteryTypeRow>;
export type BikeRow = z.output<typeof bikeRow>;
export type BatteryRow = z.output<typeof batteryRow>;
export type FittingRow = z.output<typeof fittingRow>;
export type EntryRow = z.output<typeof entryRow>;

export interface ForecastPeriodRow {
	region: string;
	period_start: string;
	forecast_intensity: number;
	index_band: ForecastFixtureRow['indexBand'];
	retrieved_at: string;
}

/** The argument to reset_planner_data: rows named as the columns. */
export interface ResetPayload {
	battery_types: BatteryTypeRow[];
	bikes: BikeRow[];
	batteries: BatteryRow[];
	fittings: FittingRow[];
	entries: EntryRow[];
	forecast_periods: ForecastPeriodRow[];
}

export class FixtureError extends Error {}

function parseFile<S extends z.ZodType>(file: string, csv: string, schema: S): z.output<S>[] {
	return parseCsv(csv).map((record, i) => {
		const result = schema.safeParse(record);
		if (!result.success) {
			// Row numbers count the header as row 1, as a spreadsheet does.
			const problems = result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ');
			throw new FixtureError(`${file} row ${i + 2}: ${problems}`);
		}
		return result.data;
	});
}

/** Retrieved at is the real time of loading, to the minute (DI-006, DEC-59). */
export function toForecastPeriodRows(rows: ForecastFixtureRow[], retrievedAt: Date): ForecastPeriodRow[] {
	const stamp = new Date(Math.floor(retrievedAt.getTime() / 60_000) * 60_000).toISOString();
	return rows.map((row) => ({
		region: row.region,
		period_start: row.periodStart.toISOString(),
		forecast_intensity: row.forecastIntensity,
		index_band: row.indexBand,
		retrieved_at: stamp,
	}));
}

/** Check every fixture row and build the reset payload. Throws FixtureError on the first bad row. */
export function buildResetPayload(
	texts: PlannerFixtureTexts,
	options: { withoutEntryIds: string[]; forecasts: ForecastFixtureRow[]; retrievedAt: Date },
): ResetPayload {
	const leaveOut = new Set(options.withoutEntryIds.map(Number));
	return {
		battery_types: parseFile(PLANNER_FIXTURE_FILES.batteryTypes, texts.batteryTypes, batteryTypeRow),
		bikes: parseFile(PLANNER_FIXTURE_FILES.bikes, texts.bikes, bikeRow),
		batteries: parseFile(PLANNER_FIXTURE_FILES.batteries, texts.batteries, batteryRow),
		fittings: parseFile(PLANNER_FIXTURE_FILES.fittings, texts.fittings, fittingRow),
		entries: parseFile(PLANNER_FIXTURE_FILES.entries, texts.entries, entryRow).filter((e) => !leaveOut.has(e.entry_id)),
		forecast_periods: toForecastPeriodRows(options.forecasts, options.retrievedAt),
	};
}

// ------------------------------------------------------------ the loader

/** What the loader needs from the database. Supabase in use; a stub in tests. */
export interface PlannerFixtureDb {
	resetPlannerData(payload: ResetPayload): Promise<void>;
	deleteForecastPeriod(region: string, periodStart: string): Promise<void>;
	upsertForecastPeriods(rows: ForecastPeriodRow[]): Promise<void>;
}

export function createPlannerFixtures(deps: {
	db: () => PlannerFixtureDb;
	loadTexts: () => Promise<PlannerFixtureTexts>;
	systemNow: () => Date;
}): PlannerFixtures {
	return {
		async resetPlannerData({ withoutEntryIds, forecasts }) {
			const payload = buildResetPayload(await deps.loadTexts(), {
				withoutEntryIds,
				forecasts,
				retrievedAt: deps.systemNow(),
			});
			await deps.db().resetPlannerData(payload);
		},
		async deleteForecastPeriod(region, periodStart) {
			await deps.db().deleteForecastPeriod(region, periodStart.toISOString());
		},
		async reloadForecasts(rows) {
			await deps.db().upsertForecastPeriods(toForecastPeriodRows(rows, deps.systemNow()));
		},
	};
}
