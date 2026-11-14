// CRP script S12 – Swollen battery (REQ-08, REQ-09, REQ-11). Starting state:
// R2 (no entry 1044), clock 16:20; E-08 checks M04 in.

import { expect, test } from '@playwright/test';
import { fact, notice, pickName, url } from './helpers.ts';
import { countFittings, latestFitting, setStartingState, standinEvent } from './stand-in.ts';

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => {
	await setStartingState('R2', '2026-06-16 16:20');
	await standinEvent('E-08');
});

const location = (page: import('@playwright/test').Page) => page.locator('.gm-summary .gm-location');

test('S12.02 S12.03 S12.04 AC-09.2 AC-08.3 B-09 fitted to M04; after Dave\'s fault report it reads "Quarantined", still fitted', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Dave Morgan');
	await page.goto(url.battery('B-09'));
	await expect(location(page)).toHaveText('Fitted to M04');
	await page.getByRole('link', { name: 'Report fault' }).click();
	await page.locator('[name="description"]').fill('Swollen – do not charge or fit');
	await page.getByRole('button', { name: 'Save fault' }).click();
	await expect(page).toHaveURL(url.battery('B-09'));
	await expect(location(page)).toHaveText('Quarantined');
	expect(await fact(page, 'Fitted to')).toBe('M04');
});

test('S12.05 AC-08.1 AC-05.5 Sam removes B-09 from M04: a fitting with no bike; M04 "No battery fitted"; B-09 "Quarantined"', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Sam Patel');
	await page.goto(url.battery('B-09'));
	await page.getByRole('link', { name: 'Remove from M04' }).click();
	await page.getByRole('button', { name: 'Remove battery' }).click();
	await expect(page).toHaveURL(url.battery('B-09'));
	await expect(location(page)).toHaveText('Quarantined');
	const f = await latestFitting('B-09');
	expect([f.bike_asset_tag, f.recorded_by, f.recorded_at]).toEqual([null, 'Sam Patel', '2026-06-16T15:20:00+00:00']);
	await page.goto(url.bike('M04'));
	expect(await fact(page, 'Battery fitted')).toBe('No battery fitted');
});

test('S12.06 S12.07 AC-11.1 AC-11.2 fitting B-09 to M04, from either end, warns first; going back saves nothing', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Dave Morgan');
	const before = await countFittings('B-09');

	// From M04.
	await page.goto(`${url.bike('M04')}swap/`);
	await page.locator('#pick-B-09').check();
	await page.getByRole('button', { name: 'Save swap' }).click();
	const warning = page.locator('.gm-confirm');
	await expect(warning.locator('h1')).toHaveText('B-09 is quarantined');
	await expect(warning).toContainText('Open fault from 16 Jun 2026:');
	await expect(warning).toContainText('Swollen – do not charge or fit');
	await expect(warning.getByRole('link', { name: 'Go back' })).toBeVisible();
	await expect(warning.getByRole('button', { name: 'Fit anyway' })).toBeVisible();
	await warning.getByRole('link', { name: 'Go back' }).click();
	expect(await countFittings('B-09')).toBe(before);
	await page.goto(url.bike('M04'));
	expect(await fact(page, 'Battery fitted')).toBe('No battery fitted');

	// From B-09.
	await page.goto(url.battery('B-09'));
	await page.locator('#pick-M04').check();
	await page.getByRole('button', { name: 'Fit battery' }).click();
	await expect(page.locator('.gm-confirm h1')).toHaveText('B-09 is quarantined');
	await page.locator('.gm-confirm').getByRole('link', { name: 'Go back' }).click();
	expect(await countFittings('B-09')).toBe(before);
});

test('S12.08 AC-11.3 Sam fits it anyway: saved with his name and the time; B-09 still "Quarantined"', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Sam Patel');
	await page.goto(url.battery('B-09'));
	await page.locator('#pick-M04').check();
	await page.getByRole('button', { name: 'Fit battery' }).click();
	await page.getByRole('button', { name: 'Fit anyway' }).click();
	await expect(page).toHaveURL(url.battery('B-09'));
	await expect(location(page)).toHaveText('Quarantined');
	const f = await latestFitting('B-09');
	expect([f.bike_asset_tag, f.recorded_by]).toEqual(['M04', 'Sam Patel']);
});

test('S12.09 S12.10 AC-11.5 once the fault is cleared, fitting B-09 to M05 shows no warning', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Sam Patel');
	await page.goto(url.battery('B-09'));
	await page.getByRole('link', { name: /Clear this fault/ }).click();
	await page.getByRole('button', { name: 'Clear fault' }).click();
	await expect(location(page)).toHaveText('Fitted to M04');

	await pickName(context, baseURL, 'Dave Morgan');
	await page.goto(`${url.bike('M05')}swap/`);
	await page.locator('#pick-B-09').check();
	await page.getByRole('button', { name: 'Save swap' }).click();
	await expect(page).toHaveURL(url.bike('M05'));
	expect(await notice(page)).toBe('Swap saved M05 now has B-09. B-05 is on the shelf.');
	await page.goto(url.battery('B-05'));
	await expect(location(page)).toHaveText('On the shelf');
	await page.goto(url.bike('M04'));
	expect(await fact(page, 'Battery fitted')).toBe('No battery fitted');
});
