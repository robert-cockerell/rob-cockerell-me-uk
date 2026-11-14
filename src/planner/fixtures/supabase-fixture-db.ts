// The fixture loader's database calls, against the D1 to D3 schema
// (supabase/migrations/20261114000000_planner_d1_d3.sql).

import { check, createDbClient, type DbSettings } from '../db/client.ts';
import type { PlannerFixtureDb } from './planner-fixtures.ts';

export function createSupabaseFixtureDb(settings: DbSettings): PlannerFixtureDb {
	const db = createDbClient(settings);
	return {
		async resetPlannerData(payload) {
			const { error } = await db.rpc('reset_planner_data', { payload });
			check('Reloading D1 to D3', error);
		},
		async deleteForecastPeriod(region, periodStart) {
			const { error } = await db.from('forecast_periods').delete().eq('region', region).eq('period_start', periodStart);
			check('Deleting a forecast period', error);
		},
		async upsertForecastPeriods(rows) {
			const { error } = await db.from('forecast_periods').upsert(rows, { onConflict: 'region,period_start' });
			check('Reloading forecast periods', error);
		},
	};
}
