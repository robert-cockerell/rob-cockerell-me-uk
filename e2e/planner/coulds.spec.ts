// The Coulds: REQ-17 (S8.05, S8.06), REQ-18 (S10.03, S10.06) and REQ-19.
// Starting state: R0, clock 07:05.

import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeFailures, url } from './helpers.ts';
import { setClock, setStartingState } from './stand-in.ts';

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => setStartingState('R0', '2026-06-16 07:05'));

/** Wait until the service worker has kept the day plan (REQ-17). */
async function planKept(page: Page): Promise<boolean> {
	return page.evaluate(async () => {
		for (let i = 0; i < 100; i++) {
			const cache = await caches.open('gm-day-plan-v1');
			if (await cache.match('/demos/charging-planner/', { ignoreVary: true })) return true;
			await new Promise((r) => setTimeout(r, 100));
		}
		return false;
	});
}

test('S8.05 S8.06 AC-17.1 AC-17.2 offline, the 07:05 plan is shown with its notice; back online, a fresh plan replaces it', async ({ page, context }) => {
	await page.goto(url.dayPlan);
	await expect(page.locator('[data-offline-notice]')).toBeHidden();
	expect(await planKept(page)).toBe(true);

	await setClock('2026-06-16 08:00');
	await context.setOffline(true);
	await page.goto(url.dayPlan);
	const offline = page.locator('[data-offline-notice]');
	await expect(offline).toBeVisible();
	await expect(offline).toContainText("You're offline");
	await expect(offline).toContainText('This is the plan your phone loaded at 07:05. It may be out of date.');
	await expect(page.locator('.gm-page-head__sub')).toHaveText('Tue 16 Jun');

	await context.setOffline(false);
	await page.goto(url.dayPlan);
	await expect(page.locator('[data-offline-notice]')).toBeHidden();
	await expect(page.locator('[data-offline-notice]')).toContainText('loaded at 08:00');
});

test('S10.06 AC-18.1 adding a battery suggests B-27, and it can be changed', async ({ page }) => {
	await page.goto(`${url.batteries}new/`);
	const tag = page.locator('[name="batteryAssetTag"]');
	await expect(tag).toHaveValue('B-27');
	await tag.fill('B-30');
	await expect(tag).toHaveValue('B-30');
});

test('S10.03 AC-18.2 adding a bike suggests M13 for a Motus (and G07 for a GSD), and the tag can be anything', async ({ page }) => {
	await page.goto(`${url.fleet}bikes/new/`);
	await expect(page.locator('#f-bikeAssetTag-hint')).toHaveText('Next free: M13 for a Motus, G07 for a GSD');
	await expect(page.locator('[name="bikeAssetTag"]')).toBeEditable();
});

test('AC-19.1 dark theme: AA contrast on the day plan and a record; band colours unchanged', async ({ page }) => {
	const fills = async () =>
		page.locator('.gm-band').evaluateAll((els) => {
			const out: Record<string, string> = {};
			for (const e of els) out[[...e.classList].find((c) => c.startsWith('gm-band--')) ?? ''] = getComputedStyle(e).backgroundColor;
			return out;
		});
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto(url.dayPlan);
	const light = await fills();
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto(url.dayPlan);
	expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('rgb(245, 243, 236)');
	expect(await fills()).toEqual(light);
	await expectNoAxeFailures(page);
	await page.goto(url.bike('M07'));
	await expectNoAxeFailures(page);
});
