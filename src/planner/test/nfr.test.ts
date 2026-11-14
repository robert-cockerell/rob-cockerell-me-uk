// NFR checks that are code or build searches (technical note §8).

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

function files(dir: string, keep: (path: string) => boolean): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? files(path, keep) : keep(path) ? [path] : [];
	});
}

describe('NFR-14 one clock for all business time', () => {
	it('no planner code reads the system clock except clock/system-now.ts', () => {
		const planner = files(join(ROOT, 'src', 'planner'), (p) => /\.(ts|astro)$/.test(p) && !/\.test\.ts$|test-support\.ts$|[\\/]standin[\\/]|[\\/]test[\\/]/.test(p));
		const pages = files(join(ROOT, 'src', 'pages', 'demos', 'charging-planner'), (p) => /\.(ts|astro)$/.test(p) && !/[\\/]stand-in[\\/]/.test(p));
		const offenders = [...planner, ...pages]
			.filter((p) => /new Date\(\)|Date\.now\(\)/.test(readFileSync(p, 'utf8')))
			.map((p) => relative(ROOT, p).replace(/\\/g, '/'));
		expect(offenders).toEqual(['src/planner/clock/system-now.ts']);
	});

	it('systemNow() is used only by the clock module, process 1 and the fixture loader (DEC-59)', () => {
		// The stand-in is test equipment with its own system time (T1).
		const users = files(join(ROOT, 'src'), (p) => /\.(ts|astro)$/.test(p) && !/\.test\.ts$|[\\/]standin[\\/]|[\\/]stand-in[\\/]/.test(p))
			.filter((p) => /systemNow\(/.test(readFileSync(p, 'utf8')))
			.map((p) => relative(ROOT, p).replace(/\\/g, '/'))
			.sort();
		expect(users).toEqual([
			'src/planner/clock/clock.ts',
			'src/planner/clock/system-now.ts',
			'src/planner/demo-fixtures.ts',
			'src/planner/fixtures/planner-fixtures.ts',
			'src/planner/forecast/job.ts',
		]);
	});
});

describe('NFR-04 read only to LibreBooking', () => {
	it('the client sends GET only', () => {
		const client = readFileSync(join(ROOT, 'src', 'planner', 'librebooking', 'client.ts'), 'utf8');
		expect(client.match(/method: '([A-Z]+)'/g)).toEqual(["method: 'GET'"]);
	});
});

describe('NFR-17 stored text never set as HTML', () => {
	it('no planner page or component uses set:html', () => {
		const astro = [
			...files(join(ROOT, 'src', 'planner'), (p) => p.endsWith('.astro')),
			...files(join(ROOT, 'src', 'pages', 'demos', 'charging-planner'), (p) => p.endsWith('.astro')),
		];
		expect(astro.filter((p) => readFileSync(p, 'utf8').includes('set:html'))).toEqual([]);
	});
});

describe('NFR-20 secrets stay on the server', () => {
	const built = join(ROOT, '.vercel', 'output', 'static');
	it.skipIf(!existsSync(built))('no built browser file contains a secret (run npm run build first)', () => {
		if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
		const secrets = ['GM_SUPABASE_SERVICE_KEY', 'GM_FORECAST_JOB_SECRET', 'GM_STANDIN_CONSOLE_KEY']
			.map((n) => process.env[n])
			.filter((v): v is string => !!v && v.length >= 8);
		expect(secrets.length).toBeGreaterThan(0);
		const leaks = files(built, () => true).filter((p) => {
			const body = readFileSync(p, 'latin1');
			return secrets.some((s) => body.includes(s));
		});
		expect(leaks).toEqual([]);
	});
});
