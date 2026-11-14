// UI spec §13 item 1: screenshots of every screen and view, at 390 × 844,
// 1024 × 768, 1440 × 900 and 1920 × 1080, light and dark, to compare with the
// reference page. Run with `npm run test:screenshots`. Written to
// ui-review-screenshots/ (not committed). The reference page needs
// `npm run theme` first.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, type Page } from '@playwright/test';
import { pickName, url } from './helpers.ts';
import { setStartingState } from './stand-in.ts';

const OUT = 'ui-review-screenshots';

test.describe.configure({ mode: 'serial' });
// Mid-morning on the main demo day: a current slot, bikes out and back.
test.beforeAll(async () => setStartingState('R0', '2026-06-16 12:10'));

type Step = (page: Page) => Promise<void>;
const go = (path: string): Step => async (page) => void (await page.goto(path));

const SCREENS: [string, Step][] = [
	['day-plan-chart-open', go(url.dayPlan)],
	['day-plan-chart-closed', async (page) => {
		await page.context().addCookies([{ name: 'gm_bandchart', value: 'closed', url: `${test.info().project.use.baseURL}/demos/charging-planner/` }]);
		await page.goto(url.dayPlan);
	}],
	['fleet-bikes', go(url.fleet)],
	['fleet-batteries', go(url.batteries)],
	['fleet-battery-types', go(url.types)],
	['bike-record-m07', go(url.bike('M07'))],
	['battery-record-b09', go(url.battery('B-09'))],
	['battery-type-record', go(url.type('Bosch PowerPack 500'))],
	['add-bike', go(`${url.fleet}bikes/new/`)],
	['add-bike-errors', async (page) => {
		await page.goto(`${url.fleet}bikes/new/`);
		await page.locator('[name="bikeAssetTag"]').fill('G7');
		await page.getByRole('button', { name: 'Save bike' }).click();
		await page.locator('.gm-error-summary').waitFor();
	}],
	['add-battery', go(`${url.batteries}new/`)],
	['add-battery-type', go(`${url.types}new/`)],
	['edit-bike', go(`${url.bike('M07')}edit/`)],
	['swap-g01', go(`${url.bike('G01')}swap/`)],
	['quarantine-warning', async (page) => {
		await page.goto(`${url.bike('M05')}swap/`);
		await page.locator('#pick-B-09').check();
		await page.getByRole('button', { name: 'Save swap' }).click();
		await page.locator('.gm-confirm').waitFor();
	}],
	['remove-b01', go(`${url.battery('B-01')}remove/`)],
	['fault-report', go(`${url.bike('M07')}fault/`)],
	['service-check', go(`${url.bike('M03')}check/`)],
	['dealer-service', go(`${url.bike('M07')}dealer-service/`)],
	['clear-fault', go(`${url.fleet}faults/1043/clear/`)],
	['name-picker', go('/demos/charging-planner/name/')],
];

for (const scheme of ['light', 'dark'] as const) {
	for (const [name, open] of SCREENS) {
		test(`§13.1 ${name}, ${scheme}`, async ({ page, context, baseURL }, info) => {
			await pickName(context, baseURL, 'Priya Shah');
			await page.emulateMedia({ colorScheme: scheme });
			await open(page);
			await page.screenshot({ path: join(OUT, `${name}--${info.project.name}--${scheme}.png`), fullPage: true });
		});
	}

	test(`§13.1 reference page, ${scheme}`, async ({ page }, info) => {
		const reference = join(process.cwd(), 'design', 'reference.html');
		test.skip(!existsSync(join(process.cwd(), 'design', 'planner.css')), 'Run npm run theme first');
		await page.emulateMedia({ colorScheme: scheme });
		await page.goto(pathToFileURL(reference).href);
		await page.screenshot({ path: join(OUT, `reference--${info.project.name}--${scheme}.png`), fullPage: true });
		for (const id of ['c01', 'c06', 'c08', 'c18']) {
			await page.locator(`#${id}`).screenshot({ path: join(OUT, `reference-${id}--${info.project.name}--${scheme}.png`) });
		}
	});
}
