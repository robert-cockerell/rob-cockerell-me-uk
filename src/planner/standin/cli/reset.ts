// npm run demo:reset -- <R0|R1|R2|R3|R3a|O-01|O-01r>
//
// Applies a reset or override as CRP script §3.4, with the same code as the
// tester console (operations.ts). Reads test-data/ from disk and the GM_
// settings from the environment (the npm script loads .env if there is one).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { plannerFixtures } from '../../demo-fixtures.ts';
import { standinSettings } from '../env.ts';
import { FIXTURE_FILES, type FixtureTexts } from '../fixtures.ts';
import {
	applyOverride,
	applyReset,
	isOverrideId,
	isResetId,
	OVERRIDE_IDS,
	RESET_IDS,
	type OperationReport,
} from '../operations.ts';
import { createSupabaseStore } from '../store-supabase.ts';
import { systemNow } from '../system-time.ts';

function readFixtures(dir: string): FixtureTexts {
	const texts = {} as FixtureTexts;
	for (const [key, file] of Object.entries(FIXTURE_FILES) as [keyof FixtureTexts, string][]) {
		texts[key] = readFileSync(join(dir, file), 'utf8');
	}
	return texts;
}

async function main(): Promise<number> {
	const id = process.argv[2] ?? '';
	if (!isResetId(id) && !isOverrideId(id)) {
		console.error(`Usage: npm run demo:reset -- <${[...RESET_IDS, ...OVERRIDE_IDS].join('|')}>`);
		return 2;
	}
	const settings = standinSettings();
	if (!settings.supabaseUrl || !settings.supabaseServiceKey) {
		console.error('Set GM_SUPABASE_URL and GM_SUPABASE_SERVICE_KEY (in .env or the environment).');
		return 2;
	}
	const deps = {
		store: createSupabaseStore({ url: settings.supabaseUrl, serviceKey: settings.supabaseServiceKey }),
		fixtures: readFixtures(join(process.cwd(), 'test-data')),
		planner: plannerFixtures,
		systemNow,
	};
	const report: OperationReport = isResetId(id) ? await applyReset(deps, id) : await applyOverride(deps, id);
	for (const line of report.done) console.log(`done     ${line}`);
	for (const line of report.skipped) console.log(`not done ${line}`);
	return report.ok ? 0 : 1;
}

// Set the exit code and let Node exit on its own. Calling process.exit() just
// after a fetch crashes Node 24 on Windows with a libuv assertion (exit 127).
main().then(
	(code) => {
		process.exitCode = code;
	},
	(error: unknown) => {
		console.error(`${id()} failed: ${(error as Error).message}`);
		process.exitCode = 1;
	},
);

function id(): string {
	return process.argv[2] ?? 'Reset';
}
