// CRP script S8 – Print and the tablet grid (REQ-12), S11.04, and S2.05 and
// S2.06's charging rules link (REQ-16). Starting state: R0, clock 07:05.

import { expect, test } from '@playwright/test';
import { bikeRow, expectNoAxeFailures, expectNoSidewaysScroll, showsGrid, statesOf, url } from './helpers.ts';
import { setClock, setStartingState } from './stand-in.ts';

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => setStartingState('R0', '2026-06-16 07:05'));

const HANDBOOK = 'https://docs.google.com/document/d/1RPkcPU35zs2kVmVeexJCgjuZUeO2-jFecB7i5H7U6nf/edit';
const wide = (page: import('@playwright/test').Page) => (page.viewportSize()?.width ?? 0) >= 992;

test('UI spec §3.3 the timeline below 992 px, the grid from 992 px', async ({ page }) => {
	await page.goto(url.dayPlan);
	expect(await showsGrid(page)).toBe(wide(page));
	await expect(page.locator('ol.gm-timeline')).toBeVisible({ visible: !wide(page) });
	await expectNoSidewaysScroll(page);
});

test('S8.02 AC-12.1 the grid: one row per bike, one column per slot headed by its time and band, each cell a state in text', async ({ page }) => {
	test.skip(!wide(page), 'The grid is for tablets and print');
	await page.goto(url.dayPlan);
	const grid = page.locator('table.gm-grid');
	await expect(grid.locator('caption')).toHaveText('Day plan for Tue 16 Jun 2026, bikes by half hour');
	const heads = grid.locator('thead th[scope="col"]');
	await expect(heads).toHaveCount(20);
	await expect(heads.nth(1)).toHaveText(/^07:00\s*moderate$/);
	await expect(heads.nth(11).locator('.gm-band--very-low')).toHaveText('very low');
	await expect(grid.locator('tbody tr')).toHaveCount(18);
	const cells = await grid.locator('tbody td').evaluateAll((tds) =>
		tds.map((td) => ((td.querySelector('.gm-grid__cell') ?? td.querySelector('.visually-hidden'))?.textContent ?? '').trim()),
	);
	expect(cells).toHaveLength(18 * 19);
	for (const c of cells) expect(c).toMatch(/^(Out on loan|In the workshop|Out of service|Overdue – not checked in)/);
	expect((await statesOf(page, 'M08'))['07:00']).toBe('Overdue – not checked in due Mon 16:30');
	await expectNoAxeFailures(page);
});

test('S8.03 AC-12.2 the print button prints; the print is the grid on one A4 landscape page with the date, every band and every state in text', async ({ page, browserName }) => {
	await page.addInitScript(() => {
		(window as unknown as { printed: number }).printed = 0;
		window.print = () => void ((window as unknown as { printed: number }).printed += 1);
	});
	await page.goto(url.dayPlan);
	await page.getByRole('button', { name: 'Print day plan' }).click();
	expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);

	await page.emulateMedia({ media: 'print' });
	await expect(page.locator('table.gm-grid')).toBeVisible();
	await expect(page.locator('ol.gm-timeline')).toBeHidden();
	for (const hidden of ['header.gm-header', 'nav.gm-tabbar', '[data-print]']) await expect(page.locator(hidden)).toBeHidden();
	await expect(page.locator('.gm-page-head')).toContainText('Day plan');
	await expect(page.locator('.gm-page-head__sub')).toHaveText('Tue 16 Jun');
	const bands = await page.locator('table.gm-grid thead .gm-band').allInnerTexts();
	expect(bands.map((b) => b.trim())).toEqual([...Array(6).fill('moderate'), ...Array(4).fill('low'), ...Array(4).fill('very low'), ...Array(4).fill('low'), 'moderate']);
	if (browserName === 'chromium') {
		const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true, preferCSSPageSize: true });
		const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];
		expect(pages.length).toBe(1);
	}
});

test('S8.04 S11.04 AC-12.3 the print carries next bookings, M07\'s open fault flag and M02\'s booked-again warning', async ({ page }) => {
	await setClock('2026-06-16 11:30');
	await page.goto(url.dayPlan);
	await page.emulateMedia({ media: 'print' });
	const row = (bike: string) => page.locator('table.gm-grid tbody th', { has: page.locator('.gm-mono', { hasText: new RegExp(`^${bike}$`) }) });
	await expect(row('M07')).toContainText('Open fault');
	await expect(row('M07')).toContainText('next out: Wed 10:00');
	await expect(row('M02')).toContainText('Booked again at 14:00');
	await expect(row('M09')).toContainText('No booking');
	await expect(page.locator('table.gm-grid')).toBeVisible();
});

test('S2.05 AC-16.1 the "Charging rules" link opens the handbook page', async ({ page }) => {
	await page.goto(url.dayPlan);
	const link = page.getByRole('link', { name: /Charging rules/ });
	await expect(link).toHaveAttribute('href', HANDBOOK);
	expect((await bikeRow(page, 'M01')).next).toMatch(/^next out: /);
});

test('S2.06 AC-16.2 the link is one fixed address: nowhere to change it', async ({ page }) => {
	for (const path of [url.dayPlan, url.fleet, `${url.bike('M07')}edit/`, '/demos/charging-planner/name/']) {
		await page.goto(path);
		await expect(page.locator('main input, main textarea, main select').filter({ hasText: /handbook|charging rules/i })).toHaveCount(0);
		await expect(page.locator('main label', { hasText: /handbook|charging rules|link/i })).toHaveCount(0);
	}
});
