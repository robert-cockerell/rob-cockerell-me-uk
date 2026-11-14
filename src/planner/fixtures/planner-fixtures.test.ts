import { describe, expect, it } from 'vitest';
import type { ForecastFixtureRow } from '../demo-fixtures.ts';
import { parseCsv } from './csv.ts';
import {
	buildResetPayload,
	createPlannerFixtures,
	FixtureError,
	type ForecastPeriodRow,
	type PlannerFixtureDb,
	type ResetPayload,
} from './planner-fixtures.ts';
import { plannerFixtureTexts } from './texts-bundled.ts';

const forecasts: ForecastFixtureRow[] = [
	{ region: 'South England', periodStart: new Date('2026-06-16T11:00:00Z'), forecastIntensity: 48, indexBand: 'very low' },
];
const loadedAt = new Date('2026-11-14T15:42:37.512Z');

function payload(withoutEntryIds: string[] = []): ResetPayload {
	return buildResetPayload(plannerFixtureTexts, { withoutEntryIds, forecasts, retrievedAt: loadedAt });
}

describe('csv', () => {
	it('keeps commas inside quotes and turns blanks into null', () => {
		const [row] = parseCsv('a,b,c\n"x, ""y""",,z\n');
		expect(row).toEqual({ a: 'x, "y"', b: null, c: 'z' });
	});
});

describe('buildResetPayload with test-data/', () => {
	it('SU.05 loads every D2 and D3 fixture row', () => {
		const p = payload();
		expect(p.battery_types).toHaveLength(3);
		expect(p.bikes).toHaveLength(18);
		expect(p.batteries).toHaveLength(26);
		expect(p.fittings).toHaveLength(18);
		expect(p.entries.map((e) => e.entry_id)).toEqual([1031, 1039, 1040, 1043, 1044]);
	});

	it('converts UK local times to instants (BR-08)', () => {
		const p = payload();
		const m01 = p.bikes.find((b) => b.bike_asset_tag === 'M01');
		expect(m01?.last_updated_at).toBe('2026-06-01T09:00:00.000Z');
		expect(p.fittings[0].fitted_from).toBe('2026-06-01T08:00:00.000Z');
		expect(p.entries.find((e) => e.entry_id === 1031)?.recorded_at).toBe('2026-04-22T14:40:00.000Z');
	});

	it('keeps blank optional items as null', () => {
		const p = payload();
		expect(p.bikes.find((b) => b.bike_asset_tag === 'G04')?.frame_size).toBeNull();
		expect(p.batteries.find((b) => b.battery_asset_tag === 'B-18')?.cycle_count).toBeNull();
		expect(p.entries.find((e) => e.entry_id === 1044)?.bike_asset_tag).toBeNull();
	});

	it('R2 leaves out entry 1044', () => {
		expect(payload(['1044']).entries.map((e) => e.entry_id)).toEqual([1031, 1039, 1040, 1043]);
	});

	it('stamps Retrieved at with the real time of loading, to the minute (DEC-59)', () => {
		expect(payload().forecast_periods).toEqual<ForecastPeriodRow[]>([
			{
				region: 'South England',
				period_start: '2026-06-16T11:00:00.000Z',
				forecast_intensity: 48,
				index_band: 'very low',
				retrieved_at: '2026-11-14T15:42:00.000Z',
			},
		]);
	});

	it('stores no bike status, fault status, period end or battery location', () => {
		const p = payload();
		const columns = new Set(
			[p.bikes[0], p.batteries[0], p.fittings[0], p.entries[0], p.forecast_periods[0]].flatMap((row) => Object.keys(row)),
		);
		for (const forbidden of ['status', 'fault_status', 'period_end', 'battery_location', 'location']) {
			expect(columns.has(forbidden)).toBe(false);
		}
	});

	it('refuses a bad row before anything changes, naming the file and row', () => {
		const texts = { ...plannerFixtureTexts, bikes: plannerFixtureTexts.bikes.replace('M02,102', 'M2,102') };
		expect(() => buildResetPayload(texts, { withoutEntryIds: [], forecasts, retrievedAt: loadedAt })).toThrow(FixtureError);
		expect(() => buildResetPayload(texts, { withoutEntryIds: [], forecasts, retrievedAt: loadedAt })).toThrow(
			/bikes\.csv row 3: bike_asset_tag/,
		);
	});

	it('refuses a local time that is not YYYY-MM-DD HH:MM', () => {
		const texts = { ...plannerFixtureTexts, fittings: plannerFixtureTexts.fittings.replace('2026-06-01 09:00', '01/06/2026 09:00') };
		expect(() => buildResetPayload(texts, { withoutEntryIds: [], forecasts, retrievedAt: loadedAt })).toThrow(
			/fittings\.csv row 2: fitted_from/,
		);
	});
});

describe('createPlannerFixtures', () => {
	function recordingDb() {
		const calls: { name: string; args: unknown[] }[] = [];
		const db: PlannerFixtureDb = {
			resetPlannerData: async (...args) => void calls.push({ name: 'reset', args }),
			deleteForecastPeriod: async (...args) => void calls.push({ name: 'delete', args }),
			upsertForecastPeriods: async (...args) => void calls.push({ name: 'upsert', args }),
		};
		return { db, calls };
	}

	it('reset sends one payload in one call', async () => {
		const { db, calls } = recordingDb();
		const loader = createPlannerFixtures({ db: () => db, loadTexts: async () => plannerFixtureTexts, systemNow: () => loadedAt });
		await loader.resetPlannerData({ withoutEntryIds: ['1044'], forecasts });
		expect(calls).toHaveLength(1);
		const sent = calls[0].args[0] as ResetPayload;
		expect(sent.entries).toHaveLength(4);
		expect(sent.forecast_periods).toHaveLength(1);
	});

	it('a bad fixture means no database call at all', async () => {
		const { db, calls } = recordingDb();
		const broken = { ...plannerFixtureTexts, entries: plannerFixtureTexts.entries.replace('1031,dealer service', '1031,repair') };
		const loader = createPlannerFixtures({ db: () => db, loadTexts: async () => broken, systemNow: () => loadedAt });
		await expect(loader.resetPlannerData({ withoutEntryIds: [], forecasts })).rejects.toThrow(/entries\.csv row 2: entry_type/);
		expect(calls).toHaveLength(0);
	});

	it('O-01 deletes one period; O-01r upserts with a fresh Retrieved at', async () => {
		const { db, calls } = recordingDb();
		const loader = createPlannerFixtures({ db: () => db, loadTexts: async () => plannerFixtureTexts, systemNow: () => loadedAt });
		await loader.deleteForecastPeriod('South England', new Date('2026-06-16T14:30:00Z'));
		await loader.reloadForecasts(forecasts);
		expect(calls[0]).toEqual({ name: 'delete', args: ['South England', '2026-06-16T14:30:00.000Z'] });
		expect(calls[1].name).toBe('upsert');
		expect((calls[1].args[0] as ForecastPeriodRow[])[0].retrieved_at).toBe('2026-11-14T15:42:00.000Z');
	});
});
