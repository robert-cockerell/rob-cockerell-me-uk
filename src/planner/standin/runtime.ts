// Wiring for the stand-in's pages and endpoints under Astro: settings, the
// Supabase store, the fixture files and route A's D1 to D3 loader.

import { plannerFixtures } from '../demo-fixtures.ts';
import { standinSettings } from './env.ts';
import { fixtureTexts } from './fixture-files.ts';
import type { OperationDeps } from './operations.ts';
import { createSupabaseStore } from './store-supabase.ts';
import { systemNow } from './system-time.ts';

export class StandinNotConfigured extends Error {}

export function standinDeps(): OperationDeps {
	const settings = standinSettings();
	if (!settings.supabaseUrl || !settings.supabaseServiceKey) {
		throw new StandinNotConfigured('GM_SUPABASE_URL and GM_SUPABASE_SERVICE_KEY must be set');
	}
	return {
		store: createSupabaseStore({ url: settings.supabaseUrl, serviceKey: settings.supabaseServiceKey }),
		fixtures: fixtureTexts,
		planner: plannerFixtures,
		systemNow,
	};
}
