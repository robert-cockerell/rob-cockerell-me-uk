// Where the D2 and D3 fixture files come from. Under Astro (and Vitest) they're
// bundled with ?raw, so the console can reset on Vercel, where test-data/
// isn't on disk. Under plain Node (`npm run demo:reset`) they're read from disk.

import type { PlannerFixtureTexts } from './planner-fixtures.ts';
import { PLANNER_FIXTURE_FILES } from './planner-fixtures.ts';

const underVite = (import.meta as ImportMeta & { env?: unknown }).env !== undefined;

export async function loadPlannerFixtureTexts(): Promise<PlannerFixtureTexts> {
	if (underVite) {
		const bundled = await import('./texts-bundled.ts');
		return bundled.plannerFixtureTexts;
	}
	const { readFileSync } = await import('node:fs');
	const { join } = await import('node:path');
	const dir = join(process.cwd(), 'test-data');
	const texts = {} as PlannerFixtureTexts;
	for (const [key, file] of Object.entries(PLANNER_FIXTURE_FILES) as [keyof PlannerFixtureTexts, string][]) {
		texts[key] = readFileSync(join(dir, file), 'utf8');
	}
	return texts;
}
