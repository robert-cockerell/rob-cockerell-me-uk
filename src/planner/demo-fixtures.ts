// The seam between the test equipment's resets and the planner's own data.
//
// The stand-in's resets (src/planner/standin/operations.ts) reload the stand-in and
// set the demo clock. Reloading D1 to D3 needs the planner's schema, which is
// route A's work once Rob approves it (DEC-55). Route A sets `plannerFixtures`
// below to its loader; until then the resets report the D1 to D3 part as
// skipped. This file sits outside src/planner/standin/ so route A can fill it
// in without changing the test equipment.

import { systemNow } from './clock/system-now.ts';
import { createPlannerFixtures } from './fixtures/planner-fixtures.ts';
import { createSupabaseFixtureDb } from './fixtures/supabase-fixture-db.ts';
import { loadPlannerFixtureTexts } from './fixtures/texts.ts';

/** One row of test-data/forecasts.csv, checked and ready to load into D1. */
export interface ForecastFixtureRow {
	/** Carbon Intensity API region name, for example "South England" (DEC-44). */
	region: string;
	/** Period start in UTC, as the API supplies it. No period end is stored (DEC-13). */
	periodStart: Date;
	/** Stored, never shown (AC-01.5, DEC-32). */
	forecastIntensity: number;
	indexBand: 'very low' | 'low' | 'moderate' | 'high' | 'very high';
}

export interface PlannerFixtures {
	/**
	 * Reload D2 and D3 from test-data/ and D1 from the forecast rows given
	 * (CRP script §3.4 step 1). Stamp Retrieved at with systemNow() (DEC-59).
	 * Leave out the entries named in `withoutEntryIds` (reset R2 leaves out 1044).
	 */
	resetPlannerData(options: { withoutEntryIds: string[]; forecasts: ForecastFixtureRow[] }): Promise<void>;
	/** Override O-01: delete one D1 period. */
	deleteForecastPeriod(region: string, periodStart: Date): Promise<void>;
	/** Override O-01r: put these D1 periods back, overwriting any with the same region and start. */
	reloadForecasts(rows: ForecastFixtureRow[]): Promise<void>;
}

// Route A's loader (src/planner/fixtures/). The database settings are read when
// a reset runs, from the same GM_ variables as the stand-in, so this works
// under Astro and under plain Node (`npm run demo:reset`), where astro:env
// isn't available.

type EnvSource = Record<string, string | undefined> | undefined;
const viteEnv: EnvSource = (import.meta as ImportMeta & { env?: EnvSource }).env;

function setting(name: string): string {
	const value = (process.env[name] ?? viteEnv?.[name])?.trim();
	if (!value) throw new Error(`${name} must be set to reload D1 to D3`);
	return value;
}

export const plannerFixtures: PlannerFixtures | null = createPlannerFixtures({
	db: () => createSupabaseFixtureDb({ url: setting('GM_SUPABASE_URL'), serviceKey: setting('GM_SUPABASE_SERVICE_KEY') }),
	loadTexts: loadPlannerFixtureTexts,
	systemNow,
});
