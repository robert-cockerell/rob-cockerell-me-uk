// CRP script S4 – Battery swap (REQ-07, REQ-08, REQ-10, NFR-01, NFR-04, NFR-14).
// Starting state: R0, clock Tue 16 June 2026 08:05; DEV-1 remembers "Dave Morgan".

import { expect, test } from '@playwright/test';
import { errorMessages, expectNoAxeFailures, expectNoSidewaysScroll, expectTapTarget, fact, notice, pickName, url } from './helpers.ts';
import { latestFitting, requestsSince, setStartingState } from './stand-in.ts';

// Steps run in order. After a failure, the next test starts a fresh worker and
// the reset runs again, so later steps don't depend on a failed one.
test.beforeAll(async () => setStartingState('R0', '2026-06-16 08:05'));
test.beforeEach(async ({ context, baseURL }) => pickName(context, baseURL, 'Dave Morgan'));

const at0805 = new Date('2026-06-16T07:05:00Z');

test('S4.02 AC-07.3 V-18 a Fitted from later than now (08:10) isn\'t accepted', async ({ page }) => {
	await page.goto(url.bike('G01'));
	await page.getByRole('link', { name: 'Swap battery' }).click();
	await page.locator('#pick-B-17').click();
	await page.locator('summary', { hasText: 'Change the time' }).click();
	await page.locator('#f-fittedFrom').fill('2026-06-16T08:10');
	await page.getByRole('button', { name: 'Save swap' }).click();
	expect(await errorMessages(page)).toEqual(["Fitted from can't be later than now"]);
	await expect(page).toHaveTitle(/^Error: /);
	expect((await latestFitting('B-17').catch(() => null))?.bike_asset_tag ?? null).toBeNull();
});

test('S4.03 AC-07.1 AC-10.4 AC-11.4 NFR-01 NFR-14 swap B-17 into G01 in two taps, stamped 08:05 by Dave Morgan', async ({ page }) => {
	await page.goto(url.bike('G01'));
	let taps = 0;
	const swap = page.getByRole('link', { name: 'Swap battery' });
	await expectTapTarget(swap);
	await swap.click();
	taps++;
	// B-17 is the first battery on the shelf, so it's chosen already.
	await expect(page.locator('#pick-B-17')).toBeChecked();
	const save = page.getByRole('button', { name: 'Save swap' });
	await expectTapTarget(save);
	await expectTapTarget(page.locator('#pick-B-17'));
	await save.click();
	taps++;
	expect(taps).toBeLessThanOrEqual(2);
	// No quarantine warning (AC-11.4): straight back to G01.
	await expect(page).toHaveURL(url.bike('G01'));
	expect(await notice(page)).toBe('Swap saved G01 now has B-17. B-14 is on the shelf.');
	expect(await fact(page, 'Battery fitted')).toContain('B-17 · Bosch PowerPack 500');
	const f = await latestFitting('B-17');
	expect(f.bike_asset_tag).toBe('G01');
	expect(new Date(f.fitted_from)).toEqual(at0805);
	expect(new Date(f.recorded_at)).toEqual(at0805);
	expect(f.recorded_by).toBe('Dave Morgan');
	await page.goto(url.battery('B-14'));
	await expect(page.locator('.gm-summary .gm-location')).toHaveText('On the shelf');
});

test('S4.04 AC-07.6 NFR-04 nothing is sent to LibreBooking, and there\'s no check-out or check-in', async ({ page }) => {
	const requests = await requestsSince(at0805);
	expect(requests.filter((r) => !['GET', 'HEAD'].includes(r.method))).toEqual([]);
	for (const path of [url.bike('G01'), `${url.bike('G01')}swap/`]) {
		await page.goto(path);
		await expect(page.locator('main')).not.toContainText(/check[- ]?(out|in)/i);
	}
});

test('S4.05 AC-07.5 AC-05.5 B-17 fitted to M04 is saved with no compatibility or duplicate check', async ({ page }) => {
	await page.goto(`${url.bike('M04')}swap/`);
	await page.locator('#pick-B-17').click();
	await page.getByRole('button', { name: 'Save swap' }).click();
	await expect(page).toHaveURL(url.bike('M04'));
	await expect(page.locator('.gm-notice--problem, .gm-error-summary, .gm-confirm')).toHaveCount(0);
	expect(await fact(page, 'Battery fitted')).toContain('B-17');
	await page.goto(url.bike('G01'));
	expect(await fact(page, 'Battery fitted')).toBe('No battery fitted');
	await page.goto(url.battery('B-09'));
	await expect(page.locator('.gm-summary .gm-location')).toHaveText('Quarantined');
});

test('S4.06 AC-08.2 AC-07.3 V-19 B-01 removed from M01 at 08:00 (earlier than now) is accepted', async ({ page }) => {
	await page.goto(url.battery('B-01'));
	await page.getByRole('link', { name: 'Remove from M01' }).click();
	await page.locator('summary', { hasText: 'Change the time' }).click();
	await page.locator('#f-fittedFrom').fill('2026-06-16T08:00');
	await page.getByRole('button', { name: 'Remove battery' }).click();
	await expect(page).toHaveURL(url.battery('B-01'));
	await expect(page.locator('.gm-summary .gm-location')).toHaveText('On the shelf');
	const f = await latestFitting('B-01');
	expect(f.bike_asset_tag).toBeNull();
	expect(f.recorded_by).toBe('Dave Morgan');
	expect(new Date(f.fitted_from)).toEqual(new Date('2026-06-16T07:00:00Z'));
	await page.goto(url.bike('M01'));
	expect(await fact(page, 'Battery fitted')).toBe('No battery fitted');
});

test('S4.07 S4.08 AC-07.2 NFR-01 after R1, B-17 fitted to G01 from the battery\'s end in two taps', async ({ page }) => {
	await setStartingState('R1', '2026-06-16 08:05');
	await page.goto(url.battery('B-17'));
	let taps = 0;
	const g01 = page.locator('#pick-G01');
	await expectTapTarget(g01);
	await g01.click();
	taps++;
	const fit = page.getByRole('button', { name: 'Fit battery' });
	await expectTapTarget(fit);
	await fit.click();
	taps++;
	expect(taps).toBeLessThanOrEqual(2);
	await expect(page).toHaveURL(url.battery('B-17'));
	await expect(page.locator('.gm-summary .gm-location')).toHaveText('Fitted to G01');
	const f = await latestFitting('B-17');
	expect([f.bike_asset_tag, f.recorded_by, new Date(f.fitted_from).toISOString()]).toEqual(['G01', 'Dave Morgan', at0805.toISOString()]);
	await page.goto(url.battery('B-14'));
	await expect(page.locator('.gm-summary .gm-location')).toHaveText('On the shelf');
});

test('S4.09 AC-08.5 after the swap, B-17 "Fitted to G01" in the battery list', async ({ page }) => {
	await page.goto(url.batteries);
	await expect(page.locator('.gm-list__row', { hasText: 'B-17' }).locator('.gm-location')).toHaveText('Fitted to G01');
	await expect(page.locator('.gm-list__row', { hasText: 'B-14' }).locator('.gm-location')).toHaveText('On the shelf');
});

test('NFR-02 NFR-03 the swap screen: no sideways scrolling, and axe finds no AA failures', async ({ page }) => {
	await page.goto(`${url.bike('G01')}swap/`);
	await expectNoSidewaysScroll(page);
	await expectNoAxeFailures(page);
});
