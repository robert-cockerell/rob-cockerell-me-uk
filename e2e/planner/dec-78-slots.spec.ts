// DEC-78: on the phone timeline each slot with bikes listed opens and closes
// (native <details>). Only the current slot is open on load, or 07:00 when
// there's no current slot; slots with no changes don't open; a band chart bar
// opens its slot. The grid (C07) is unchanged.
// Starting state: R0, clock Tue 16 June 2026 12:10.

import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeFailures, expectTapTarget, url } from './helpers.ts';
import { setClock, setStartingState } from './stand-in.ts';

test.beforeAll(async () => setStartingState('R0', '2026-06-16 12:10'));

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 992;
const slot = (page: Page, time: string) => page.locator(`#slot-${time.replace(':', '')}`);
const openTimes = (page: Page) =>
	page.$$eval('ol.gm-timeline details.gm-slot__details[open]', (els) => els.map((d) => d.querySelector('time')?.textContent?.trim()));

test.describe('phone timeline', () => {
	test.skip(({ viewport }) => (viewport?.width ?? 0) >= 992, 'The timeline is the phone layout; tablets show the grid');

	test('DEC-78 a closed slot shows its time, band and how many bikes change', async ({ page }) => {
		await page.goto(url.dayPlan);
		const head = (time: string) => slot(page, time).locator('.gm-slot__head');
		await expect(head('07:00').locator('.gm-slot__count')).toHaveText('All 18 bikes');
		await expect(head('07:30').locator('.gm-slot__count')).toHaveText('2 bikes change');
		await expect(head('09:30').locator('.gm-slot__count')).toHaveText('1 bike changes');
		await expect(head('12:00').locator('.gm-slot__count')).toHaveText('4 bikes change');
		for (const time of ['07:30', '09:30']) {
			await expect(head(time).locator('time')).toBeVisible();
			await expect(head(time).locator('.gm-band')).toBeVisible();
			await expect(slot(page, time).locator('.gm-slot__bikes')).toBeHidden();
		}
	});

	test('DEC-78 a slot with no changes reads "No changes" and doesn\'t open', async ({ page }) => {
		await page.goto(url.dayPlan);
		const quiet = slot(page, '08:30');
		await expect(quiet.locator('.gm-slot__quiet')).toHaveText('No changes');
		await expect(quiet.locator('details, summary')).toHaveCount(0);
	});

	test('DEC-78 at 12:10 only the current slot, 12:00, is open', async ({ page }) => {
		await page.goto(url.dayPlan);
		expect(await openTimes(page)).toEqual(['12:00']);
		await expect(slot(page, '12:00').locator('a.gm-bike-row')).toHaveCount(4);
		await expect(slot(page, '12:00').locator('a.gm-bike-row').first()).toBeVisible();
	});

	test('DEC-78 tapping a closed slot opens it, and tapping again closes it', async ({ page }) => {
		await page.goto(url.dayPlan);
		const summary = slot(page, '07:30').locator('summary');
		await summary.click();
		await expect(slot(page, '07:30').locator('a.gm-bike-row', { hasText: 'M10' })).toBeVisible();
		await summary.click();
		await expect(slot(page, '07:30').locator('a.gm-bike-row', { hasText: 'M10' })).toBeHidden();
	});

	test('DEC-78 NFR-01 each slot summary is at least 44 px tall and keeps the focus ring', async ({ page }) => {
		await page.goto(url.dayPlan);
		const summary = slot(page, '07:30').locator('summary');
		const box = (await summary.boundingBox())!;
		expect(box.height).toBeGreaterThanOrEqual(44);
		await expectTapTarget(summary);
		await summary.focus();
		await page.keyboard.press('Enter');
		await expect(slot(page, '07:30').locator('.gm-slot__bikes')).toBeVisible();
		expect(await summary.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
	});

	test('DEC-78 C18 following a band chart bar opens its closed slot', async ({ page }) => {
		await page.goto(url.dayPlan);
		await expect(slot(page, '14:00').locator('.gm-slot__bikes')).toBeHidden();
		await page.locator('.d-lg-none a.gm-bandchart__link[href="#slot-1400"]').click();
		await expect(page).toHaveURL(/#slot-1400$/);
		await expect(slot(page, '14:00').locator('a.gm-bike-row').first()).toBeVisible();
		await expect(slot(page, '14:00').locator('time')).toBeInViewport();
	});

	test('DEC-78 a link straight to a slot opens it on load', async ({ page }) => {
		await page.goto(url.dayPlan + '#slot-0800');
		await expect(slot(page, '08:00').locator('a.gm-bike-row').first()).toBeVisible();
	});

	test('DEC-78 not remembered: after a reload only the current slot is open again', async ({ page }) => {
		await page.goto(url.dayPlan);
		await slot(page, '07:30').locator('summary').click();
		await page.reload();
		expect(await openTimes(page)).toEqual(['12:00']);
	});

	test('DEC-78 without JavaScript the current slot is open and a closed slot still opens', async ({ browser, viewport }) => {
		const context = await browser.newContext({ javaScriptEnabled: false, viewport });
		const page = await context.newPage();
		await page.goto(url.dayPlan);
		expect(await openTimes(page)).toEqual(['12:00']);
		await slot(page, '07:30').locator('summary').click();
		await expect(slot(page, '07:30').locator('.gm-slot__bikes')).toBeVisible();
		await context.close();
	});

	test('NFR-03 axe finds no WCAG 2.1 AA failures with a slot open and others closed', async ({ page }) => {
		await page.goto(url.dayPlan);
		await expectNoAxeFailures(page);
	});

	test('DEC-78 with no current slot, 07:00 is open: before 07:00 and after 16:30', async ({ page }) => {
		try {
			await setClock('2026-06-16 06:45');
			await page.goto(url.dayPlan);
			expect(await openTimes(page)).toEqual(['07:00']);
			await expect(page.locator('li.gm-slot--now')).toHaveCount(0);
			await setClock('2026-06-16 16:40');
			await page.reload();
			expect(await openTimes(page)).toEqual(['07:00']);
			await expect(page.locator('li.gm-slot--now')).toHaveCount(0);
		} finally {
			await setClock('2026-06-16 12:10');
		}
	});
});

test('DEC-78 the grid is unchanged on tablets: every bike in every column, nothing to open', async ({ page }) => {
	test.skip(isPhone(page), 'Phones show the timeline');
	await page.goto(url.dayPlan);
	await expect(page.locator('table.gm-grid tbody th[scope="row"]')).toHaveCount(18);
	await expect(page.locator('table.gm-grid details')).toHaveCount(0);
	await expect(page.locator('ol.gm-timeline')).toBeHidden();
});
