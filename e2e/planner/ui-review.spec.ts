// UI review (ui-review-fixes): UI-A-01 the current slot, UI-A-02 the Battery
// types list, C18 the band chart (DEC-76) and the bottom dock (DEC-77).
// Starting state: R0, clock Tue 16 June 2026 12:10.

import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeFailures, expectNoSidewaysScroll, pickName, url } from './helpers.ts';
import { setStartingState } from './stand-in.ts';

test.beforeAll(async () => setStartingState('R0', '2026-06-16 12:10'));

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 992;
const box = async (page: Page, selector: string) => (await page.locator(selector).first().boundingBox())!;

test.describe('UI-A-01 the current slot', () => {
	test.skip(({ viewport }) => (viewport?.width ?? 0) >= 992, 'The timeline is the phone layout');

	test('its time is aria-current="time" and marked "now"; the label doesn\'t stretch the band row', async ({ page }) => {
		await page.goto(url.dayPlan);
		const now = page.locator('li.gm-slot--now');
		await expect(now).toHaveCount(1);
		await expect(now.locator('time')).toHaveAttribute('aria-current', 'time');
		await expect(now.locator('time')).toHaveText('12:00');
		// The band tag and the line under it (the count, DEC-78) sit as close as in any other slot.
		const gap = async (slot: string) =>
			page.locator(slot).first().evaluate((li) => {
				const band = li.querySelector('.gm-slot__band')!.getBoundingClientRect();
				const next = (li.querySelector('.gm-slot__count') ?? li.querySelector('.gm-slot__quiet'))!.getBoundingClientRect();
				return next.top - band.bottom;
			});
		expect(await gap('li.gm-slot--now')).toBeLessThanOrEqual((await gap('li.gm-slot:not(.gm-slot--now)')) + 1);
	});

	test('a solid surface background with side padding; its columns line up with the other slots', async ({ page }) => {
		await page.goto(url.dayPlan);
		const style = await page.locator('li.gm-slot--now').evaluate((li) => {
			const cs = getComputedStyle(li);
			return { image: cs.backgroundImage, colour: cs.backgroundColor, padLeft: cs.paddingLeft, radius: cs.borderTopLeftRadius };
		});
		expect(style.image).toBe('none');
		expect(style.colour).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
		expect(style.padLeft).toBe('12px');
		expect(style.radius).toBe('8px');
		const nowTime = await box(page, 'li.gm-slot--now time');
		const otherTime = await box(page, 'li.gm-slot:not(.gm-slot--now) time');
		expect(Math.abs(nowTime.x - otherTime.x)).toBeLessThan(1);
		const nowBand = await box(page, 'li.gm-slot--now .gm-slot__band');
		const otherBand = await box(page, 'li.gm-slot:not(.gm-slot--now) .gm-slot__band');
		expect(Math.abs(nowBand.x - otherBand.x)).toBeLessThan(1);
	});
});

test('UI-A-02 battery type names stay on one line and never overlap the capacity', async ({ page }) => {
	await page.goto(url.types);
	const rows = page.locator('.gm-list__row--name');
	await expect(rows).toHaveCount(3);
	for (const row of await rows.all()) {
		const [name, capacity] = await row.locator('span').evaluateAll((spans) => spans.slice(0, 2).map((s) => {
			const r = s.getBoundingClientRect();
			return { left: r.left, right: r.right, top: r.top, height: r.height, lines: Math.round(r.height / parseFloat(getComputedStyle(s).lineHeight)) };
		}));
		expect(name.lines).toBe(1);
		expect(name.right).toBeLessThanOrEqual(capacity.left);
	}
	await expectNoSidewaysScroll(page);
});

// The page carries two charts, one for the phone timeline and one for the grid,
// each shown only at its widths (DEC-82): tests use the one on screen.
const CHART = 'details.gm-bandchart:visible';

test.describe('C18 band chart (DEC-76, DEC-80)', () => {
	test('at the top of the day plan, open by default: 19 bars, the hours, "now" in text, no band labels, no figures', async ({ page }) => {
		await page.goto(url.dayPlanAll);
		const chart = page.locator(CHART);
		await expect(chart).toHaveAttribute('open', '');
		await expect(chart.locator('summary')).toHaveText('Carbon forecast');
		// Above the slots or the grid.
		const slots = wide(page) ? 'table.gm-grid' : 'ol.gm-timeline';
		expect((await box(page, CHART)).y).toBeLessThan((await box(page, slots)).y);
		const svg = chart.locator('svg[role="img"]');
		await expect(svg.locator('title')).toHaveText("Today's carbon bands");
		await expect(svg.locator('desc')).toHaveText('07:00 to 09:30 moderate, 10:00 to 11:30 low, 12:00 to 13:30 very low, 14:00 to 15:30 low, 16:00 moderate');
		await expect(svg.locator('rect.gm-bandchart__bar')).toHaveCount(19);
		// DEC-80: each whole hour in small text under its bar; no band labels under the bars.
		await expect(chart.locator('.gm-bandchart__hours span')).toHaveText(['07', '08', '09', '10', '11', '12', '13', '14', '15', '16']);
		const hour = await chart.locator('.gm-bandchart__hours span').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
		expect(hour).toBeLessThanOrEqual(12);
		await expect(chart.locator('.gm-bandchart__labels, .gm-band')).toHaveCount(0);
		await expect(chart.locator('.gm-bandchart__now')).toHaveText('now, 12:00');
		// No figures: once the times and the hours are taken out, no digit in the chart's text.
		const text = (await chart.evaluate((d) => {
			const copy = d.cloneNode(true) as HTMLElement;
			copy.querySelector('.gm-bandchart__hours')?.remove();
			return copy.textContent ?? '';
		})).replace(/\d{2}:\d{2}/g, '');
		expect(text).not.toMatch(/\d/);
		expect(await svg.locator('text').count()).toBe(0);
		await expectNoSidewaysScroll(page);
	});

	test('taller bars for higher bands; the very low stretch is the shortest', async ({ page }) => {
		await page.goto(url.dayPlanAll);
		const heights = await page.locator(`${CHART} rect.gm-bandchart__bar`).evaluateAll((rs) => rs.map((r) => Number(r.getAttribute('height'))));
		const veryLow = heights.slice(10, 14);
		const moderate = heights.slice(0, 6);
		expect(Math.max(...veryLow)).toBeLessThan(Math.min(...moderate));
	});

	test('each bar links to its slot, is at least 44 px tall and shows the focus ring', async ({ page }) => {
		await page.goto(url.dayPlanAll);
		const links = page.locator('.gm-bandchart__links:visible a');
		await expect(links).toHaveCount(19);
		// 19 bars across a phone are narrower than 44 px; the brief asks for 44 px tall.
		for (const i of [0, 12, 18]) expect((await links.nth(i).boundingBox())!.height).toBeGreaterThanOrEqual(44);
		const target = wide(page) ? '#grid-1200' : '#slot-1200';
		await expect(links.nth(10)).toHaveAttribute('href', target);
		await links.nth(10).focus();
		expect(await links.nth(10).evaluate((a) => getComputedStyle(a).outlineStyle)).toBe('solid');
		await links.nth(10).click();
		await expect(page).toHaveURL(new RegExp(`${target}$`));
		await expect(page.locator(target)).toBeInViewport();
	});

	test('closing it is remembered by the server; no cookie means open; without JavaScript it\'s open', async ({ page, browser }) => {
		await page.goto(url.dayPlan);
		await page.locator(`${CHART} summary`).click();
		await expect(page.locator(CHART)).not.toHaveAttribute('open', '');
		// The toggle event comes just after the click; wait for the script to set the cookie.
		await expect.poll(async () => (await page.context().cookies()).find((c) => c.name === 'gm_bandchart')?.value).toBe('closed');
		const cookie = (await page.context().cookies()).find((c) => c.name === 'gm_bandchart');
		expect(cookie?.path).toBe('/demos/charging-planner/');
		expect(cookie?.sameSite).toBe('Lax');
		// The server renders it closed: the HTML itself has no "open".
		const html = await (await page.request.get(url.dayPlan)).text();
		expect(html).toMatch(/<details class="gm-bandchart"[^>]*data-bandchart/);
		expect(html.match(/<details class="gm-bandchart"[^>]*>/)?.[0]).not.toContain('open');
		await page.reload();
		await expect(page.locator(CHART)).not.toHaveAttribute('open', '');
		await page.locator(`${CHART} summary`).click();
		await expect.poll(async () => (await page.context().cookies()).find((c) => c.name === 'gm_bandchart')?.value).toBe('open');
		await page.reload();
		await expect(page.locator(CHART)).toHaveAttribute('open', '');

		const noJs = await browser.newContext({ javaScriptEnabled: false, baseURL: test.info().project.use.baseURL });
		const p = await noJs.newPage();
		await p.goto(url.dayPlan);
		await expect(p.locator(CHART)).toHaveAttribute('open', '');
		await noJs.close();
	});

	test('not in the print', async ({ page }) => {
		await page.goto(url.dayPlan);
		await page.emulateMedia({ media: 'print' });
		await expect(page.locator(CHART)).toHaveCount(0);
		await expect(page.locator('nav.gm-tabbar')).toBeHidden();
	});

	test('NFR-03 axe finds no AA failures with the chart open, light and dark', async ({ page }) => {
		for (const colorScheme of ['light', 'dark'] as const) {
			await page.emulateMedia({ colorScheme });
			await page.goto(url.dayPlan);
			await expectNoAxeFailures(page);
		}
	});
});

test.describe('DEC-77 the bottom dock', () => {
	test('the tab bar at every width, no tabs in the header; from 992 px a centred dock the width of the content', async ({ page }) => {
		await page.goto(url.fleet);
		await expect(page.locator('header.gm-header nav')).toHaveCount(0);
		const bar = page.locator('nav.gm-tabbar');
		await expect(bar).toBeVisible();
		await expect(bar.getByRole('link')).toHaveText(['Day plan', 'Fleet']);
		const b = (await bar.boundingBox())!;
		const vw = page.viewportSize()!.width;
		const vh = page.viewportSize()!.height;
		expect(b.y + b.height).toBeGreaterThan(vh - 24);
		if (wide(page)) {
			expect(b.width).toBeLessThanOrEqual(720);
			expect(Math.abs(b.x + b.width / 2 - vw / 2)).toBeLessThan(2);
			const content = (await box(page, 'main'));
			expect(Math.abs(b.width - Math.min(720, content.width - 32))).toBeLessThan(40);
		} else {
			expect(b.width).toBe(vw);
		}
	});

	test('the action bar sits above the dock, and the last row is never covered', async ({ page, context, baseURL }) => {
		await pickName(context, baseURL, 'Priya Shah');
		await page.goto(`${url.bike('M07')}fault/`);
		const dock = (await box(page, 'nav.gm-tabbar'));
		const bar = (await box(page, '.gm-actionbar'));
		expect(bar.y + bar.height).toBeLessThanOrEqual(dock.y + 1);
		await page.goto(url.batteries);
		await page.mouse.wheel(0, 50_000);
		const last = await box(page, '.gm-list li:last-child');
		const dock2 = await box(page, 'nav.gm-tabbar');
		expect(last.y + last.height).toBeLessThanOrEqual(dock2.y + 1);
	});
});
