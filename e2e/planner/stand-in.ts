// The test equipment, driven from the browser tests: resets, the demo clock
// and stand-in events (CRP script §3.4), through the stand-in's own operations.
// Plus read-only checks of D2 and the request log that a CRP facilitator
// would make by inspecting stored data (SU.04).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { plannerFixtures } from '../../src/planner/demo-fixtures.ts';
import { standinSettings } from '../../src/planner/standin/env.ts';
import { FIXTURE_FILES, type FixtureTexts } from '../../src/planner/standin/fixtures.ts';
import { applyEvent, applyReset, setDemoClock, type OperationDeps, type ResetId } from '../../src/planner/standin/operations.ts';
import { createSupabaseStore } from '../../src/planner/standin/store-supabase.ts';
import { systemNow } from '../../src/planner/standin/system-time.ts';
import { createDbClient } from '../../src/planner/db/client.ts';

if (existsSync('.env') && !process.env.GM_SUPABASE_URL) process.loadEnvFile('.env');

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

function ok(report: { ok: boolean; skipped: string[] }) {
	if (!report.ok || report.skipped.length) throw new Error(`Test equipment step failed: ${report.skipped.join('; ')}`);
}

/** Apply a reset, then hold the demo clock at a UK local time. */
export async function setStartingState(reset: ResetId, local: string): Promise<void> {
	const d = deps();
	ok(await applyReset(d, reset));
	ok(await setDemoClock(d, local, false));
}

/** Hold the demo clock at a UK local time, "YYYY-MM-DD HH:MM". */
export async function setClock(local: string): Promise<void> {
	ok(await setDemoClock(deps(), local, false));
}

/** Apply a row of stand-in-events.csv (E-01 to E-08). */
export async function standinEvent(id: string): Promise<void> {
	ok(await applyEvent(deps(), id));
}

/** The tool's requests in the stand-in's log since a demo time (NFR-04). */
export async function requestsSince(demoAt: Date) {
	return deps().store.listRequests({ sinceDemo: demoAt, limit: 1000 });
}

function db() {
	const s = standinSettings();
	return createDbClient({ url: s.supabaseUrl as string, serviceKey: s.supabaseServiceKey as string });
}

/** The latest fitting of a battery, as stored (AC-07.1). */
export async function latestFitting(battery: string) {
	const { data, error } = await db()
		.from('fittings')
		.select('*')
		.eq('battery_asset_tag', battery)
		.order('fitted_from', { ascending: false })
		.limit(1)
		.single();
	if (error) throw new Error(error.message);
	return data as { battery_asset_tag: string; fitted_from: string; bike_asset_tag: string | null; recorded_by: string; recorded_at: string };
}

export async function countFittings(battery: string): Promise<number> {
	const { count, error } = await db().from('fittings').select('*', { count: 'exact', head: true }).eq('battery_asset_tag', battery);
	if (error) throw new Error(error.message);
	return count ?? 0;
}

export async function latestEntry(asset: { bike?: string; battery?: string }) {
	const q = db().from('entries').select('*').order('entry_id', { ascending: false }).limit(1);
	const { data, error } = await (asset.bike ? q.eq('bike_asset_tag', asset.bike) : q.eq('battery_asset_tag', asset.battery as string)).single();
	if (error) throw new Error(error.message);
	return data as { entry_id: number; entry_type: string; entry_date: string; description: string; recorded_by: string; recorded_at: string; cleared_date: string | null; cleared_by: string | null };
}
