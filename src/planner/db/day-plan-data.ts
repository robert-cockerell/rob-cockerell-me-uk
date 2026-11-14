// What process 2 reads from D1 to D3: DF-12 Forecast periods, DF-13 Bike list
// and DF-24 Open bike faults.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IndexBand, OpenBikeFault, PlanBike, PlanForecast } from '../plan/types.ts';
import { check } from './client.ts';

/** The depot is in Cowley, OX4: the API's South England region (DEC-44, DI-003). */
export const FORECAST_REGION = 'South England';

export interface DayPlanData {
	listBikes(): Promise<PlanBike[]>;
	listOpenBikeFaults(): Promise<OpenBikeFault[]>;
	listForecasts(from: Date, to: Date): Promise<PlanForecast[]>;
}

export function createDayPlanData(db: SupabaseClient): DayPlanData {
	return {
		async listBikes() {
			const { data, error } = await db
				.from('bikes')
				.select('bike_asset_tag, librebooking_resource_id')
				.order('bike_asset_tag');
			check('Reading the bike list', error);
			return (data ?? []).map((b) => ({ bikeAssetTag: b.bike_asset_tag, librebookingResourceId: b.librebooking_resource_id }));
		},

		async listOpenBikeFaults() {
			// A fault is open while its Cleared date is blank (DEC-14).
			const { data, error } = await db
				.from('entries')
				.select('entry_id, bike_asset_tag')
				.eq('entry_type', 'fault')
				.is('cleared_date', null)
				.not('bike_asset_tag', 'is', null);
			check('Reading open bike faults', error);
			return (data ?? []).map((f) => ({ bikeAssetTag: f.bike_asset_tag, entryId: Number(f.entry_id) }));
		},

		async listForecasts(from, to) {
			const { data, error } = await db
				.from('forecast_periods')
				.select('period_start, index_band')
				.eq('region', FORECAST_REGION)
				.gte('period_start', from.toISOString())
				.lt('period_start', to.toISOString());
			check('Reading forecasts', error);
			return (data ?? []).map((p) => ({ periodStart: new Date(p.period_start), indexBand: p.index_band as IndexBand }));
		},
	};
}
