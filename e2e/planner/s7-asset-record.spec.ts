// CRP script S7 – Standing next to M07 (REQ-05), with S4.01, S4.09 and the
// battery records' locations (REQ-08). Starting state: R0, clock 09:15.

import { expect, test } from '@playwright/test';
import { expectNoAxeFailures, expectNoSidewaysScroll, fact, history, text, url } from './helpers.ts';
import { setStartingState } from './stand-in.ts';

test.beforeAll(async () => setStartingState('R0', '2026-06-16 09:15'));

test('S7.01 AC-05.7 from the day plan, M07\'s last service is two taps away', async ({ page }) => {
	await page.goto(url.dayPlan);
	await page.locator('a.gm-bike-row', { hasText: 'M07' }).first().click();
	await expect(page.locator('main h1')).toHaveText('M07');
	expect(await fact(page, 'Last service')).toBe('Service check, 11 Jun 2026');
});

test('S7.02 AC-05.1 the last service and the fitted battery come first', async ({ page }) => {
	await page.goto(url.bike('M07'));
	const facts = await page.locator('.gm-summary__fact dt').allInnerTexts();
	expect(facts.slice(0, 2)).toEqual(['Last service', 'Battery fitted']);
	expect(await fact(page, 'Last service')).toBe('Service check, 11 Jun 2026');
	const battery = await fact(page, 'Battery fitted');
	expect(battery).toContain('B-07 · Bosch PowerTube 500');
	expect(battery).toContain('Bought 14 Mar 2023');
	expect(battery).toContain('301 cycles');
	await expectNoSidewaysScroll(page);
});

test('S7.03 AC-05.2 history newest first by Entry date, then Entry ID: 1040, 1039, 1043, 1031', async ({ page }) => {
	await page.goto(url.bike('M07'));
	expect((await history(page)).map((h) => h.id)).toEqual([1040, 1039, 1043, 1031]);
});

test('S7.04 AC-05.4 1043 reads open; 1039 reads closed with its Cleared date and Cleared by', async ({ page }) => {
	await page.goto(url.bike('M07'));
	const items = await history(page);
	const f1043 = items.find((h) => h.id === 1043)!.text;
	const f1039 = items.find((h) => h.id === 1039)!.text;
	expect(f1043).toContain('Fault open');
	expect(f1043).toContain('Clear this fault');
	expect(f1039).toContain('Fault closed');
	expect(f1039).toContain('Cleared 11 Jun 2026 by Sam Patel');
	expect(f1039).not.toContain('Clear this fault');
});

test('S7.05 AC-05.6 the change stamp: Last updated by Priya Shah, 10 Jun 2026 14:03', async ({ page }) => {
	await page.goto(url.bike('M07'));
	expect(await text(page.locator('.gm-summary__stamp'))).toBe('Last updated by Priya Shah, 10 Jun 2026 14:03');
});

test('S7.06 AC-05.5 empty values: G01 "One size", B-10 "Not recorded", B-18 "Not yet read"', async ({ page }) => {
	await page.goto(url.bike('G01'));
	expect(await fact(page, 'Frame size')).toBe('One size');
	await page.goto(url.battery('B-10'));
	expect(await fact(page, 'Bosch serial')).toBe('Not recorded');
	await page.goto(url.battery('B-18'));
	expect(await fact(page, 'Cycle count')).toBe('Not yet read');
});

test('S4.01 AC-05.3 AC-08.3 B-17 reads "On the shelf" first; B-09 "Quarantined" although fitted to M04', async ({ page }) => {
	await page.goto(url.battery('B-17'));
	await expect(page.locator('.gm-summary .gm-location')).toHaveText('On the shelf');
	await page.goto(url.battery('B-09'));
	await expect(page.locator('.gm-summary .gm-location')).toHaveText('Quarantined');
	await expect(page.locator('.gm-summary')).toContainText('Open fault from 12 Jun 2026: Swollen – do not charge or fit');
	expect(await fact(page, 'Fitted to')).toBe('M04');
});

test('S4.09 AC-08.5 the battery list shows all 26 batteries with their locations', async ({ page }) => {
	await page.goto(url.batteries);
	const rows = await page.locator('.gm-list__row').evaluateAll((els) =>
		els.map((e) => [e.querySelector('.gm-list__tag')?.textContent?.trim(), (e.querySelector('.gm-location')?.textContent ?? '').trim()]),
	);
	expect(rows).toHaveLength(26);
	const where = Object.fromEntries(rows);
	expect(where['B-09']).toBe('Quarantined');
	expect(where['B-14']).toBe('Fitted to G01');
	expect(where['B-17']).toBe('On the shelf');
	for (const t of ['B-18', 'B-21', 'B-22', 'B-23', 'B-24', 'B-25', 'B-26']) expect(where[t], t).toBe('On the shelf');
	expect(Object.values(where).filter((w) => w.startsWith('Fitted to'))).toHaveLength(17);
	await expectNoSidewaysScroll(page);
});

test('NFR-03 axe finds no WCAG 2.1 AA failures on an asset record', async ({ page }) => {
	await page.goto(url.bike('M07'));
	await expectNoAxeFailures(page);
	await page.goto(url.battery('B-09'));
	await expectNoAxeFailures(page);
});

test('SU.03 AC-10.6 NFR-05 no password or login on any screen', async ({ page }) => {
	for (const path of [url.dayPlan, url.fleet, url.batteries, url.bike('M07'), url.battery('B-07'), `${url.bike('M07')}swap/`, `${url.bike('M07')}fault/`, '/demos/charging-planner/name/']) {
		await page.goto(path);
		await expect(page.locator('input[type="password"]'), path).toHaveCount(0);
		await expect(page.locator('main'), path).not.toContainText(/log ?in|sign ?in|password/i);
	}
});
