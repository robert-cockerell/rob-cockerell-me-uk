import { describe, expect, it } from 'vitest';
import { runForecastJob, type ApiPeriod, type ForecastJobDb, type ForecastPeriodRow } from './job.ts';

function fakeDb(existing: Date[] = []) {
	const upserted: ForecastPeriodRow[] = [];
	const deleted: Date[] = [];
	const db: ForecastJobDb = {
		upsert: async (rows) => void upserted.push(...rows),
		listOlderThan: async (_region, cutoff) => existing.filter((d) => d < cutoff),
		delete: async (_region, starts) => void deleted.push(...starts),
	};
	return { db, upserted, deleted };
}

const period = (from: string, forecast: number | null, index: string | null): ApiPeriod => ({ from, intensity: { forecast, index } });

describe('process 1 (DEC-48, DEC-59)', () => {
	it('fetches from the current half hour by the system clock and stores band, intensity and Retrieved at', async () => {
		const { db, upserted } = fakeDb();
		const asked: Date[] = [];
		const report = await runForecastJob({
			fetchForecast: async (from) => {
				asked.push(from);
				return { region: 'South England', periods: [period('2026-11-14T17:00Z', 180, 'moderate'), period('2026-11-14T17:30Z', 201, 'high')] };
			},
			db,
			systemNow: () => new Date('2026-11-14T17:12:41Z'),
		});
		expect(asked).toEqual([new Date('2026-11-14T17:00:00Z')]);
		expect(upserted).toEqual([
			{ region: 'South England', period_start: '2026-11-14T17:00:00.000Z', forecast_intensity: 180, index_band: 'moderate', retrieved_at: '2026-11-14T17:12:00.000Z' },
			{ region: 'South England', period_start: '2026-11-14T17:30:00.000Z', forecast_intensity: 201, index_band: 'high', retrieved_at: '2026-11-14T17:12:00.000Z' },
		]);
		expect(report.saved).toBe(2);
		// DEC-13: no period end.
		expect(Object.keys(upserted[0])).not.toContain('period_end');
	});

	it('DEC-59 never overwrites the recorded forecasts on a scenario date (S9, 8 December)', async () => {
		const { db, upserted } = fakeDb();
		const report = await runForecastJob({
			fetchForecast: async () => ({ region: 'South England', periods: [period('2026-12-07T23:30Z', 150, 'moderate'), period('2026-12-08T07:00Z', 120, 'low')] }),
			db,
			systemNow: () => new Date('2026-12-07T23:10:00Z'),
		});
		expect(upserted.map((r) => r.period_start)).toEqual(['2026-12-07T23:30:00.000Z']);
		expect(report.skippedScenarioDates).toBe(1);
	});

	it('DI-004 DI-005 a period with no forecast or band isn\'t stored', async () => {
		const { db, upserted } = fakeDb();
		const report = await runForecastJob({
			fetchForecast: async () => ({ region: 'South England', periods: [period('2026-11-14T17:00Z', null, 'low'), period('2026-11-14T17:30Z', 90, 'medium')] }),
			db,
			systemNow: () => new Date('2026-11-14T17:00:00Z'),
		});
		expect(upserted).toEqual([]);
		expect(report.skippedNoForecast).toBe(2);
	});

	it('NFR-10 deletes periods older than 30 days, except the scenario dates', async () => {
		const { db, deleted } = fakeDb([
			new Date('2026-06-16T11:00:00Z'), // S1, kept
			new Date('2026-03-30T06:00:00Z'), // S14, kept
			new Date('2026-10-01T12:00:00Z'), // old, deleted
			new Date('2026-11-01T12:00:00Z'), // within 30 days, kept
		]);
		const report = await runForecastJob({ fetchForecast: async () => ({ region: 'South England', periods: [] }), db, systemNow: () => new Date('2026-11-14T17:00:00Z') });
		expect(deleted).toEqual([new Date('2026-10-01T12:00:00Z')]);
		expect(report.deletedOld).toBe(1);
	});
});
