// The test equipment, driven from the browser tests: resets, the demo clock
// and stand-in events (CRP script §3.4), through the stand-in's own operations.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { plannerFixtures } from '../../src/planner/demo-fixtures.ts';
import { standinSettings } from '../../src/planner/standin/env.ts';
import { FIXTURE_FILES, type FixtureTexts } from '../../src/planner/standin/fixtures.ts';
import { applyReset, setDemoClock, type OperationDeps, type ResetId } from '../../src/planner/standin/operations.ts';
import { createSupabaseStore } from '../../src/planner/standin/store-supabase.ts';
import { systemNow } from '../../src/planner/standin/system-time.ts';

function deps(): OperationDeps {
	const settings = standinSettings();
	if (!settings.supabaseUrl || !settings.supabaseServiceKey) {
		throw new Error('Set GM_SUPABASE_URL and GM_SUPABASE_SERVICE_KEY in .env to run the browser tests');
	}
	const fixtures = {} as FixtureTexts;
	for (const [key, file] of Object.entries(FIXTURE_FILES) as [keyof FixtureTexts, string][]) {
		fixtures[key] = readFileSync(join(process.cwd(), 'test-data', file), 'utf8');
	}
	return {
		store: createSupabaseStore({ url: settings.supabaseUrl, serviceKey: settings.supabaseServiceKey }),
		fixtures,
		planner: plannerFixtures,
		systemNow,
	};
}

/** Apply a reset, then hold the demo clock at a UK local time. */
export async function setStartingState(reset: ResetId, local: string): Promise<void> {
	const d = deps();
	for (const report of [await applyReset(d, reset), await setDemoClock(d, local, false)]) {
		if (!report.ok || report.skipped.length) throw new Error(`Starting state not set: ${report.skipped.join('; ')}`);
	}
}
