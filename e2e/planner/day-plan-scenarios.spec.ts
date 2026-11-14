// CRP script S2, S13, S11, S3, S14 and S9 on the day plan (REQ-01 to REQ-03,
// REQ-15, NFR-06), in the script's run order (§4). Starting state: R0.

import { expect, test } from '@playwright/test';
import { bikeRow, history, pickName, statesOf, text, url } from './helpers.ts';
import { setClock, setStartingState, standinEvent } from './stand-in.ts';

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => setStartingState('R0', '2026-06-16 10:00'));

const W = 'In the workshop';
const L = 'Out on loan';
const between = (states: Record<string, string>, from: string, to: string) =>
	[...new Set(Object.entries(states).filter(([t]) => t >= from && t <= to).map(([, s]) => s))];

async function bands(page: import('@playwright/test').Page) {
	return page.locator('.gm-slot__band .gm-band').allInnerTexts().then((b) => b.map((x) => x.trim()));
}

test('S2.01 S2.02 AC-03.1 M03 checked in at 10:00 reads "In the workshop" from the 09:30 slot, "next out: Wed 13:00"', async ({ page }) => {
	await standinEvent('E-01');
	await page.goto(url.dayPlan);
	const m03 = await statesOf(page, 'M03');
	expect(m03['09:00']).toBe(L);
	expect(between(m03, '09:30', '16:00')).toEqual([W]);
	expect((await bikeRow(page, 'M03')).next).toBe('next out: Wed 13:00');
});

test('S2.03 AC-03.2 AC-03.5 M04 and M01 both show "next out: 14:00"; M01\'s 09:00 loan has started', async ({ page }) => {
	await page.goto(url.dayPlan);
	expect((await bikeRow(page, 'M04')).next).toBe('next out: 14:00');
	expect((await bikeRow(page, 'M01')).next).toBe('next out: 14:00');
});

test('S2.04 AC-01.5 the very low slots sit beside M03\'s next booking, with no advice', async ({ page }) => {
	await page.goto(url.dayPlan);
	expect((await bands(page)).slice(10, 14)).toEqual(['very low', 'very low', 'very low', 'very low']);
	await expect(page.locator('main')).not.toContainText(/charge (now|it|at)|best time|recommend/i);
});

test('S13.01 S13.02 AC-02.4 M05 checked in at 10:15: "Out on loan" 08:00 to 09:30, "In the workshop" from 10:00', async ({ page }) => {
	await setClock('2026-06-16 10:15');
	await standinEvent('E-02');
	await setClock('2026-06-16 10:30');
	await page.goto(url.dayPlan);
	const m05 = await statesOf(page, 'M05');
	expect(between(m05, '08:00', '09:30')).toEqual([L]);
	expect(between(m05, '10:00', '16:00')).toEqual([W]);
});

test('S11.01 S11.02 AC-02.3 AC-15.1 at 11:30, M02 is overdue (due 11:00) to 13:30, out 14:00 to 15:30, and booked again at 14:00', async ({ page }) => {
	await setClock('2026-06-16 11:30');
	await page.goto(url.dayPlan);
	const m02 = await statesOf(page, 'M02');
	expect(between(m02, '11:00', '13:30')).toEqual(['Overdue – not checked in due 11:00']);
	expect(between(m02, '14:00', '15:30')).toEqual([L]);
	expect((await bikeRow(page, 'M02')).flags).toEqual(['Booked again at 14:00']);
});

test('S11.05 AC-15.2 M08 is overdue (due Mon 16:30), "next out: Wed 14:00", with no booked-again warning', async ({ page }) => {
	await page.goto(url.dayPlan);
	expect(between(await statesOf(page, 'M08'), '07:00', '16:00')).toEqual(['Overdue – not checked in due Mon 16:30']);
	const m08 = await bikeRow(page, 'M08');
	expect(m08.next).toBe('next out: Wed 14:00');
	expect(m08.flags).toEqual([]);
});

test('S11.06 to S11.08 AC-15.3 DEC-30 M02 checked in at 11:45: no warning; 11:00 still overdue, workshop from 11:30', async ({ page }) => {
	await setClock('2026-06-16 11:45');
	await standinEvent('E-03');
	await page.goto(url.dayPlan);
	expect((await bikeRow(page, 'M02')).flags).toEqual([]);
	const m02 = await statesOf(page, 'M02');
	expect(m02['11:00']).toBe('Overdue – not checked in due 11:00');
	expect(between(m02, '11:30', '13:30')).toEqual([W]);
	expect(between(m02, '14:00', '15:30')).toEqual([L]);
});

test('S3.01 S3.02 AC-03.3 M06 checked in at 15:30 shows "next out: Wed 09:00"', async ({ page }) => {
	await setClock('2026-06-16 15:30');
	await standinEvent('E-07');
	await page.goto(url.dayPlan);
	expect((await bikeRow(page, 'M06')).next).toBe('next out: Wed 09:00');
});

test('S3.04 AC-03.6 on Fri 19 June (R3), G03 shows "next out: Mon 09:00"', async ({ page }) => {
	await setStartingState('R3', '2026-06-19 09:00');
	await page.goto(url.dayPlan);
	await expect(page.locator('.gm-page-head__sub')).toHaveText('Fri 19 Jun');
	expect((await bikeRow(page, 'G03')).next).toBe('next out: Mon 09:00');
});

test('S14.01 S14.02 NFR-06 Mon 30 March (BST): 07:00 and 07:30 very low, 08:00 moderate; stamps read local time', async ({ page, context, baseURL }) => {
	await setStartingState('R3a', '2026-03-30 09:00');
	await page.goto(url.dayPlan);
	expect((await bands(page)).slice(0, 3)).toEqual(['very low', 'very low', 'moderate']);
	await pickName(context, baseURL, 'Priya Shah');
	await page.goto(`${url.bike('M09')}check/`);
	await page.locator('[name="description"]').fill('Weekly check: OK');
	await page.getByRole('button', { name: 'Save service check' }).click();
	expect((await history(page))[0].text).toContain('Recorded by Priya Shah, 30 Mar 2026 09:00');
	await page.goto(`${url.bike('M09')}edit/`);
	await page.locator('[name="frameSize"]').fill('M');
	await page.getByRole('button', { name: 'Save bike' }).click();
	expect(await text(page.locator('.gm-summary__stamp'))).toBe('Last updated by Priya Shah, 30 Mar 2026 09:00');
});

test('S14.03 S14.04 NFR-06 Mon 26 October (GMT): 07:00 moderate, not very low; stamps read local time', async ({ page, context, baseURL }) => {
	await setClock('2026-10-26 09:00');
	await page.goto(url.dayPlan);
	expect((await bands(page))[0]).toBe('moderate');
	await pickName(context, baseURL, 'Priya Shah');
	await page.goto(`${url.bike('M09')}edit/`);
	await page.locator('[name="frameSize"]').fill('L');
	await page.getByRole('button', { name: 'Save bike' }).click();
	expect(await text(page.locator('.gm-summary__stamp'))).toBe('Last updated by Priya Shah, 26 Oct 2026 09:00');
});

test('S9.01 S9.02 AC-01.4 Tue 8 December: every slot\'s band; none singled out; no figures or advice', async ({ page }) => {
	await setClock('2026-12-08 07:00');
	await page.goto(url.dayPlan);
	expect(await bands(page)).toEqual([...Array(4).fill('high'), ...Array(12).fill('moderate'), ...Array(3).fill('very high')]);
	await expect(page.locator('main')).not.toContainText(/least bad|best|greenest|gCO|kWh|recommend/i);
});
