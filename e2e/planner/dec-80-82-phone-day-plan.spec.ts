// The phone day plan's second round: DEC-80 (band chart "Carbon forecast",
// hours, no band labels), DEC-81 (Bikes in and Bikes out) and DEC-82 ("Rest of
// day" and "All day"; no print button on phones).
// Starting state: R0, clock Tue 16 June 2026 12:10.

import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeFailures, expectNoSidewaysScroll, url } from './helpers.ts';
import { setClock, setStartingState } from './stand-in.ts';

test.beforeAll(async () => setStartingState('R0', '2026-06-16 12:10'));

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 992;
const CHART = 'details.gm-bandchart:visible';
const slotTimes = (page: Page) => page.locator('ol.gm-timeline > li.gm-slot time.gm-slot__time').allInnerTexts();
const views = (page: Page) => page.locator('nav.gm-segment[aria-label="Day plan view"]');
const fact = (page: Page, label: string) =>
	page.locator('.gm-summary--counts .gm-summary__fact').filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd');

test.describe('phone day plan', () => {
	test.skip(({ viewport }) => (viewport?.width ?? 0) >= 992, 'Phone layout; tablets show the grid');

	test('DEC-82 "Rest of day" is the default: the current slot to 16:00, the first listing every bike', async ({ page }) => {
		await page.goto(url.dayPlan);
		await expect(views(page).getByRole('link', { name: 'Rest of day' })).toHaveAttribute('aria-current', 'page');
		await expect(views(page).getByRole('link', { name: 'All day' })).not.toHaveAttribute('aria-current', 'page');
		expect(await slotTimes(page)).toEqual(['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']);
		await expect(page.locator('li.gm-slot--now .gm-slot__count')).toHaveText('All 18 bikes');
		await expect(page.locator('li.gm-slot--now a.gm-bike-row')).toHaveCount(18);
		// The chart draws the same slots, "now" under the first.
		const chart = page.locator(CHART);
		await expect(chart.locator('rect.gm-bandchart__bar')).toHaveCount(9);
		await expect(chart.locator('.gm-bandchart__hours span')).toHaveText(['12', '13', '14', '15', '16']);
		await expect(chart.locator('.gm-bandchart__now')).toHaveText('now, 12:00');
		await expect(chart.locator('a.gm-bandchart__link').first()).toHaveAttribute('href', '#slot-1200');
		await expectNoSidewaysScroll(page);
	});

	test('DEC-82 "All day" is the whole day, as before; the view isn\'t remembered', async ({ page }) => {
		await page.goto(url.dayPlan);
		await views(page).getByRole('link', { name: 'All day' }).click();
		await expect(page).toHaveURL(/\?view=all$/);
		await expect(views(page).getByRole('link', { name: 'All day' })).toHaveAttribute('aria-current', 'page');
		expect(await slotTimes(page)).toHaveLength(19);
		await expect(page.locator('#slot-0700 .gm-slot__count')).toHaveText('All 18 bikes');
		await expect(page.locator('#slot-1200 .gm-slot__count')).toHaveText('4 bikes change');
		await expect(page.locator(`${CHART} rect.gm-bandchart__bar`)).toHaveCount(19);
		await views(page).getByRole('link', { name: 'Rest of day' }).click();
		expect(await slotTimes(page)).toHaveLength(9);
		await page.goto(url.dayPlan);
		await expect(views(page).getByRole('link', { name: 'Rest of day' })).toHaveAttribute('aria-current', 'page');
	});

	test('DEC-82 the views are a segmented control: links at least 44 px tall, above the chart', async ({ page }) => {
		await page.goto(url.dayPlan);
		for (const name of ['Rest of day', 'All day']) {
			const box = (await views(page).getByRole('link', { name }).boundingBox())!;
			expect(box.height).toBeGreaterThanOrEqual(44);
		}
		const nav = (await views(page).boundingBox())!;
		const chart = (await page.locator(CHART).boundingBox())!;
		expect(nav.y).toBeLessThan(chart.y);
	});

	test('DEC-82 before 07:00 "Rest of day" is the whole day; after 16:30 "Nothing more today"', async ({ page }) => {
		try {
			await setClock('2026-06-16 06:45');
			await page.goto(url.dayPlan);
			expect(await slotTimes(page)).toHaveLength(19);
			await expect(page.locator('li.gm-slot--now')).toHaveCount(0);
			await expect(page.locator(`${CHART} rect.gm-bandchart__bar`)).toHaveCount(19);

			await setClock('2026-06-16 16:40');
			await page.goto(url.dayPlan);
			await expect(page.locator('ol.gm-timeline')).toHaveCount(0);
			await expect(page.locator('.gm-timeline__end')).toHaveText('Nothing more today');
			await expect(page.locator(CHART)).toHaveCount(0);
			// "All day" still has the day.
			await page.goto(url.dayPlanAll);
			expect(await slotTimes(page)).toHaveLength(19);
			await expect(page.locator(CHART)).toHaveCount(1);
		} finally {
			await setClock('2026-06-16 12:10');
		}
	});

	test('DEC-81 Bikes in and Bikes out now: in the workshop or out of service is in; out on loan or overdue is out', async ({ page }) => {
		await page.goto(url.dayPlan);
		const panel = page.locator('.gm-summary--counts');
		await expect(panel).toBeVisible();
		await expect(panel).toHaveAttribute('aria-label', 'Bikes at 12:00');
		// The current slot lists every bike in "Rest of day": count its states.
		const states = await page.locator('li.gm-slot--now a.gm-bike-row .gm-state').allTextContents();
		expect(states).toHaveLength(18);
		const out = states.filter((s) => /Out on loan|Overdue/.test(s)).length;
		await expect(fact(page, 'Bikes in')).toHaveText(String(18 - out));
		await expect(fact(page, 'Bikes out')).toHaveText(String(out));
		// Side by side, above the views.
		const [a, b] = await panel.locator('.gm-summary__fact').all();
		expect(Math.abs((await a.boundingBox())!.y - (await b.boundingBox())!.y)).toBeLessThan(1);
		expect((await panel.boundingBox())!.y).toBeLessThan((await views(page).boundingBox())!.y);
	});

	test('DEC-81 at 07:00 on the sample day: 16 in, 2 out (M08 overdue, G04 out on loan)', async ({ page }) => {
		try {
			await setClock('2026-06-16 07:00');
			await page.goto(url.dayPlan);
			await expect(fact(page, 'Bikes in')).toHaveText('16');
			await expect(fact(page, 'Bikes out')).toHaveText('2');
		} finally {
			await setClock('2026-06-16 12:10');
		}
	});

	test('DEC-82 no print button on phones', async ({ page }) => {
		await page.goto(url.dayPlan);
		await expect(page.getByRole('button', { name: 'Print day plan' })).toBeHidden();
	});

	test('DEC-80 the chart reads "Carbon forecast", with no band labels under the bars', async ({ page }) => {
		await page.goto(url.dayPlan);
		await expect(page.locator(`${CHART} > summary`)).toHaveText('Carbon forecast');
		await expect(page.locator(`${CHART} .gm-bandchart__labels`)).toHaveCount(0);
		// Band names are still in text: the drawing's description and each bar's link.
		await expect(page.locator(`${CHART} desc`)).toHaveText('12:00 to 13:30 very low, 14:00 to 15:30 low, 16:00 moderate');
		await expect(page.locator(`${CHART} a.gm-bandchart__link`).first()).toHaveText('12:00, very low');
	});

	test('NFR-03 axe finds no WCAG 2.1 AA failures in "Rest of day" and "All day", light and dark', async ({ page }) => {
		for (const colorScheme of ['light', 'dark'] as const) {
			await page.emulateMedia({ colorScheme });
			for (const view of [url.dayPlan, url.dayPlanAll]) {
				await page.goto(view);
				await expectNoAxeFailures(page);
			}
		}
	});
});

test.describe('tablets and desktop', () => {
	test.skip(({ viewport }) => (viewport?.width ?? 0) < 992, 'Wide layout');

	test('DEC-82 DEC-81 DEC-80 the grid stays all day with its print button; no views or counts; the chart reads "Carbon forecast" with hours', async ({ page }) => {
		await page.goto(url.dayPlan);
		await expect(page.locator('table.gm-grid')).toBeVisible();
		await expect(page.locator('table.gm-grid thead th[id^="grid-"]')).toHaveCount(19);
		await expect(page.locator(`${CHART} rect.gm-bandchart__bar`)).toHaveCount(19);
		await expect(page.locator(`${CHART} > summary`)).toHaveText('Carbon forecast');
		await expect(page.locator(`${CHART} .gm-bandchart__hours span`)).toHaveText(['07', '08', '09', '10', '11', '12', '13', '14', '15', '16']);
		await expect(page.locator(`${CHART} a.gm-bandchart__link`).first()).toHaveAttribute('href', '#grid-0700');
		await expect(page.getByRole('button', { name: 'Print day plan' })).toBeVisible();
		await expect(views(page)).toBeHidden();
		await expect(page.locator('.gm-summary--counts')).toBeHidden();
	});
});
