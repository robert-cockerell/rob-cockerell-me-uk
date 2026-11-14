// UI spec §13.1: screenshots of each screen, light and dark, to compare by eye
// with design/reference.html. Written to test-results/screenshots/ (not
// committed). The reference page needs `npm run theme` first.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from '@playwright/test';
import { setStartingState } from './stand-in.ts';

const OUT = join('test-results', 'screenshots');

test.beforeAll(async () => setStartingState('R0', '2026-06-16 07:00'));

for (const scheme of ['light', 'dark'] as const) {
	test(`UI spec §13.1 day plan screenshot, ${scheme}`, async ({ page }, info) => {
		await page.emulateMedia({ colorScheme: scheme });
		await page.goto('/demos/charging-planner/');
		await page.screenshot({ path: join(OUT, `day-plan-${info.project.name}-${scheme}.png`), fullPage: true });
		await page.screenshot({ path: join(OUT, `day-plan-${info.project.name}-${scheme}-first-screen.png`) });
	});

	test(`UI spec §13.1 reference page C06, ${scheme}`, async ({ page }, info) => {
		const reference = join(process.cwd(), 'design', 'reference.html');
		test.skip(!existsSync(join(process.cwd(), 'design', 'planner.css')), 'Run npm run theme first');
		await page.emulateMedia({ colorScheme: scheme });
		await page.goto(pathToFileURL(reference).href);
		await page.locator('#c06 .ref-phone').screenshot({ path: join(OUT, `reference-c06-${info.project.name}-${scheme}.png`) });
	});
}
