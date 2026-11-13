// The seam between the test equipment's resets and the planner's own data.
//
// The stand-in's resets (src/planner/standin/operations.ts) reload the stand-in and
// set the demo clock. Reloading D1 to D3 needs the planner's schema, which is
// route A's work once Rob approves it (DEC-55). Route A sets `plannerFixtures`
// below to its loader; until then the resets report the D1 to D3 part as
// skipped. This file sits outside src/planner/standin/ so route A can fill it
// in without changing the test equipment.

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

/** Route A sets this once its schema is approved. Null on the T1 branch. */
export const plannerFixtures: PlannerFixtures | null = null;
