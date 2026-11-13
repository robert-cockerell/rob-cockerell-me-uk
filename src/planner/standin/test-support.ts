// Shared set-up for the stand-in's unit tests: the real fixture files from
// test-data/, an in-memory store and a controllable system clock.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ForecastFixtureRow, PlannerFixtures } from '../demo-fixtures.ts';
import { setClock } from './clock.ts';
import { FIXTURE_FILES, type FixtureTexts } from './fixtures.ts';
import { parseLondonLocal } from './london.ts';
import type { OperationDeps } from './operations.ts';
import { createMemoryStore } from './store-memory.ts';

export function realFixtures(): FixtureTexts {
	const dir = join(process.cwd(), 'test-data');
	const texts = {} as FixtureTexts;
	for (const [key, file] of Object.entries(FIXTURE_FILES) as [keyof FixtureTexts, string][]) {
		texts[key] = readFileSync(join(dir, file), 'utf8');
	}
	return texts;
}

export function local(text: string): Date {
	const d = parseLondonLocal(text);
	if (!d) throw new Error(`Bad local time in test: ${text}`);
	return d;
}

/** A recording stand-in for route A's loader. */
export function fakePlanner() {
	const calls: { name: string; args: unknown }[] = [];
	const planner: PlannerFixtures = {
		async resetPlannerData(options) {
			calls.push({ name: 'resetPlannerData', args: options });
		},
		async deleteForecastPeriod(region: string, periodStart: Date) {
			calls.push({ name: 'deleteForecastPeriod', args: { region, periodStart } });
		},
		async reloadForecasts(rows: ForecastFixtureRow[]) {
			calls.push({ name: 'reloadForecasts', args: rows });
		},
	};
	return { planner, calls };
}

export function testDeps(options: { planner?: PlannerFixtures | null } = {}) {
	let system = new Date('2026-11-13T12:00:00Z');
	const store = createMemoryStore(setClock(local('2026-06-16 07:00'), false, system));
	const deps: OperationDeps = {
		store,
		fixtures: realFixtures(),
		planner: options.planner ?? null,
		systemNow: () => new Date(system.getTime()),
	};
	return {
		deps,
		store,
		/** Move the system clock on. */
		advance(ms: number) {
			system = new Date(system.getTime() + ms);
		},
	};
}
