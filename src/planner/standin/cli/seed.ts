// npm run demo:seed -- <supabase-project-ref>
//
// Loads D1 to D3 and the stand-in from test-data/ into whichever Supabase
// project GM_SUPABASE_URL points at: the same code as reset R0 (operations.ts),
// so the data is exactly what the conference room pilot started from.
//
// It overwrites everything in that project's planner tables and stand-in, so it
// asks for the project's ref and refuses unless it matches GM_SUPABASE_URL. That
// stops it running against the wrong project by accident.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { plannerFixtures } from '../../demo-fixtures.ts';
import { standinSettings } from '../env.ts';
import { FIXTURE_FILES, type FixtureTexts } from '../fixtures.ts';
import { applyReset } from '../operations.ts';
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
	const ref = process.argv[2]?.trim();
	const settings = standinSettings();
	if (!settings.supabaseUrl || !settings.supabaseServiceKey) {
		console.error('Set GM_SUPABASE_URL and GM_SUPABASE_SERVICE_KEY (in .env or the environment).');
		return 2;
	}
	const host = new URL(settings.supabaseUrl).hostname;
	if (!ref) {
		console.error(`Usage: npm run demo:seed -- <project-ref>\nGM_SUPABASE_URL points at ${host}. Give its ref (the part before .supabase.co) to confirm.`);
		return 2;
	}
	if (host !== `${ref}.supabase.co`) {
		console.error(`Not seeding: GM_SUPABASE_URL points at ${host}, not ${ref}.supabase.co.`);
		return 2;
	}
	console.log(`Seeding ${host}`);
	const report = await applyReset(
		{
			store: createSupabaseStore({ url: settings.supabaseUrl, serviceKey: settings.supabaseServiceKey }),
			fixtures: readFixtures(join(process.cwd(), 'test-data')),
			planner: plannerFixtures,
			systemNow,
		},
		'R0',
	);
	for (const line of report.done) console.log(`done     ${line}`);
	for (const line of report.skipped) console.log(`not done ${line}`);
	return report.ok ? 0 : 1;
}

// Set the exit code and let Node exit on its own (see reset.ts).
main().then(
	(code) => {
		process.exitCode = code;
	},
	(error: unknown) => {
		console.error(`Seed failed: ${(error as Error).message}`);
		process.exitCode = 1;
	},
);
