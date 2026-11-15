// CRP script S1 – The day at 07:00, steps S1.01 to S1.10, on a phone held
// upright (390 × 844). Starting state: R0, demo clock Tue 16 June 2026 07:00
// (global setup).

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { setStartingState } from './stand-in.ts';

const DAY_PLAN = '/demos/charging-planner/';
const TIMES = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

interface Row { tag: string; state: string; next: string; flags: string[]; href: string | null }
interface Slot { time: string; now: boolean; band: string; bandClass: string | null; quiet: string | null; bikes: Row[] }

async function readTimeline(page: Page): Promise<Slot[]> {
	return page.$$eval('ol.gm-timeline > li.gm-slot', (slots) => {
		const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
		return slots.map((s) => {
			const band = s.querySelector('.gm-band');
			return {
				time: text(s.querySelector('time.gm-slot__time')),
				now: s.classList.contains('gm-slot--now'),
				band: text(band),
				bandClass: [...(band?.classList ?? [])].find((c) => c.startsWith('gm-band--')) ?? null,
				quiet: s.querySelector('.gm-slot__quiet') ? text(s.querySelector('.gm-slot__quiet')) : null,
				bikes: [...s.querySelectorAll('a.gm-bike-row')].map((r) => ({
					tag: text(r.querySelector('.gm-bike-row__tag')),
					state: text(r.querySelector('.gm-state')),
					next: text(r.querySelector('.gm-next')),
					flags: [...r.querySelectorAll('.gm-flag')].map((f) => text(f)),
					href: r.getAttribute('href'),
				})),
			};
		});
	});
}

let timeline: Slot[];

// Starting state: R0, clock Tue 16 June 2026 07:00 (SU.05, SU.06).
test.beforeAll(async () => setStartingState('R0', '2026-06-16 07:00'));

test.beforeEach(async ({ page }) => {
	await page.goto(DAY_PLAN);
	timeline = await readTimeline(page);
});

const slot = (time: string) => timeline.find((s) => s.time === time) as Slot;

/**
 * DEC-78: on phones a slot's bike rows show once it's open. Open the slots a
 * step reads by tapping their summaries, as Dave would, and check the rows show.
 * Tablets show the grid (S8.02), so there's nothing to open.
 */
async function openSlots(page: Page, times: string[]) {
	if ((page.viewportSize()?.width ?? 0) >= 992) return;
	for (const time of times) {
		const details = page.locator(`#slot-${time.replace(':', '')} details.gm-slot__details`);
		if ((await details.count()) === 0) continue; // "No changes": nothing to open
		if (!(await details.evaluate((d) => (d as HTMLDetailsElement).open))) await details.locator('summary').click();
		await expect(details.locator('a.gm-bike-row').first(), time).toBeVisible();
	}
}
const W = 'In the workshop';
const L = 'Out on loan';

test('S1.01 AC-01.1 19 slots, 07:00 to 16:00, and no others', async ({ page }) => {
	await expect(page).toHaveTitle('Day plan – Charging planner');
	await expect(page.getByRole('heading', { level: 1, name: 'Day plan' })).toBeVisible();
	await expect(page.locator('.gm-page-head__sub')).toHaveText('Tue 16 Jun');
	expect(timeline.map((s) => s.time)).toEqual(TIMES);
	// C06, UI-A-01: the current slot is marked "now", on a solid surface background.
	expect(timeline.filter((s) => s.now).map((s) => s.time)).toEqual(['07:00']);
	const nowSlot = page.locator('li.gm-slot--now');
	expect(await nowSlot.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe('none');
	await expect(nowSlot.locator('time')).toHaveAttribute('aria-current', 'time');
	expect(await nowSlot.locator('time').evaluate((el) => getComputedStyle(el, '::after').content)).toBe('"now"');
});

test('S1.02 AC-01.2 AC-04.5 every slot shows its band as a coloured fill and its name in text', async ({ page }) => {
	const expected = [
		...Array(6).fill('moderate'),
		...Array(4).fill('low'),
		...Array(4).fill('very low'),
		...Array(4).fill('low'),
		'moderate',
	];
	expect(timeline.map((s) => s.band)).toEqual(expected);
	expect(timeline.map((s) => s.bandClass)).toEqual(expected.map((b) => `gm-band--${b.replace(' ', '-')}`));
	// The fill is a real colour, not transparent.
	const fills = await page.$$eval('.gm-slot__band .gm-band', (els) => els.map((e) => getComputedStyle(e).backgroundColor));
	for (const fill of fills) expect(fill).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
});

test('S1.03 AC-04.1 slots run top to bottom and the page doesn\'t scroll sideways', async ({ page }) => {
	// From 992 px the day plan is the grid (UI spec §3.3), tested in S8.02.
	test.skip((page.viewportSize()?.width ?? 0) >= 992, 'Tablet sizes show the grid; see S8.02');
	const tops = await page.$$eval('ol.gm-timeline > li.gm-slot', (els) => els.map((e) => e.getBoundingClientRect().top));
	for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
	const { scrollWidth, clientWidth } = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth,
	}));
	expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	await page.mouse.wheel(0, 20_000);
	await expect(page.locator('li.gm-slot').last().locator('time')).toBeInViewport();
});

test('S1.04 AC-04.2 AC-02.5 AC-02.9 AC-02.10 the 07:00 slot lists all 18 bikes with their 07:00 states', async ({ page }) => {
	await openSlots(page, ['07:00']);
	const first = slot('07:00').bikes;
	expect(first.map((b) => b.tag).sort()).toEqual(
		['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'G01', 'G02', 'G03', 'G04', 'G05', 'G06'].sort(),
	);
	const state = Object.fromEntries(first.map((b) => [b.tag, b.state]));
	expect(state.M08).toBe('Overdue – not checked in due Mon 16:30');
	expect(state.M09).toBe(W);
	expect(state.G04).toBe(L);
	expect(state.G05).toBe('Out of service');
	const others = Object.entries(state).filter(([tag]) => !['M08', 'G04', 'G05'].includes(tag));
	for (const [, s] of others) expect(s).toBe(W);
});

test('S1.05 AC-04.2 each later slot lists only the bikes whose state changes', async ({ page }) => {
	await openSlots(page, TIMES.slice(1));
	const expected: Record<string, string[]> = {
		'07:30': ['M10 L', 'M11 L'],
		'08:00': ['G01 L', 'M03 L', 'M05 L'],
		'08:30': [],
		'09:00': ['M01 L', 'M02 L'],
		'09:30': ['G03 L'],
		'10:00': ['G06 L', 'M03 W'],
		'10:30': [],
		'11:00': ['M02 W'],
		'11:30': [],
		'12:00': ['M01 W', 'M05 W', 'M06 L', 'M11 W'],
		'12:30': ['M10 W'],
		'13:00': ['G01 W'],
		'13:30': [],
		'14:00': ['G06 W', 'M01 L', 'M02 L', 'M04 L'],
		'14:30': [],
		'15:00': [],
		'15:30': ['G03 W', 'M06 W'],
		'16:00': ['M02 W'],
	};
	const abbreviate = (s: string) => (s === W ? 'W' : s === L ? 'L' : s);
	for (const [time, changes] of Object.entries(expected)) {
		const s = slot(time);
		expect(s.bikes.map((b) => `${b.tag} ${abbreviate(b.state)}`).sort(), time).toEqual(changes);
		expect(s.quiet, time).toBe(changes.length ? null : 'No changes');
	}
});

test('S1.06 AC-04.3 AC-02.6 the greenest slots and the bikes back over lunch, without leaving the screen', async ({ page }) => {
	// DEC-78: the 12:00 and 12:30 slots open in place, one tap each.
	await openSlots(page, ['12:00', '12:30']);
	expect(timeline.filter((s) => s.band === 'very low').map((s) => s.time)).toEqual(['12:00', '12:30', '13:00', '13:30']);
	expect(slot('12:00').bikes.find((b) => b.tag === 'M11')?.state).toBe(W);
	expect(slot('12:30').bikes.find((b) => b.tag === 'M10')?.state).toBe(W);
	expect(timeline.flatMap((s) => s.bikes).filter((b) => ['M10', 'M11'].includes(b.tag) && b.state.startsWith('Overdue'))).toEqual([]);
	await expect(page).toHaveURL(/\/demos\/charging-planner\/$/);
});

test('S1.07 AC-02.2 M01 reads Out on loan from 09:00 to 11:30', async ({ page }) => {
	await openSlots(page, ['09:00', '12:00']);
	expect(slot('09:00').bikes.find((b) => b.tag === 'M01')?.state).toBe(L);
	for (const t of ['09:30', '10:00', '10:30', '11:00', '11:30']) expect(slot(t).bikes.find((b) => b.tag === 'M01'), t).toBeUndefined();
	expect(slot('12:00').bikes.find((b) => b.tag === 'M01')?.state).toBe(W);
});

test('S1.08 AC-04.4 AC-03.4 every bike shows its next booking on the day plan; M09 "No booking"', async ({ page }) => {
	await openSlots(page, TIMES);
	const expected: Record<string, string> = {
		M01: 'next out: 09:00', M02: 'next out: 09:00', M03: 'next out: 08:00', M04: 'next out: 14:00',
		M05: 'next out: 08:00', M06: 'next out: 12:00', M07: 'next out: Wed 10:00', M08: 'next out: Wed 14:00',
		M09: 'No booking', M10: 'next out: 07:30', M11: 'next out: 07:30', M12: 'No booking',
		G01: 'next out: 08:00', G02: 'No booking', G03: 'next out: 09:30', G04: 'No booking',
		G05: 'No booking', G06: 'next out: 10:00',
	};
	const shown = Object.fromEntries(slot('07:00').bikes.map((b) => [b.tag, b.next]));
	expect(shown).toEqual(expected);
	// Every row in every slot carries it, so it's visible wherever the bike is listed.
	for (const row of timeline.flatMap((s) => s.bikes)) expect(row.next).toBe(expected[row.tag]);
});

test('S1.09 AC-13.1 M07 carries an open fault flag, icon and text, and its state is unchanged', async ({ page }) => {
	await openSlots(page, ['07:00']);
	const m07 = slot('07:00').bikes.find((b) => b.tag === 'M07') as Row;
	expect(m07.flags).toEqual(['Open fault']);
	expect(m07.state).toBe(W);
	await expect(page.locator('a.gm-bike-row', { hasText: 'M07' }).locator('.gm-flag--fault svg.gm-icon')).toHaveCount(1);
	// No other bike is flagged at 07:00 (AC-13.3: M04's quarantined battery doesn't flag M04).
	expect(slot('07:00').bikes.filter((b) => b.flags.length).map((b) => b.tag)).toEqual(['M07']);
});

test('S1.10 AC-01.5 bands only: no gCO₂/kWh figures and no advice on what to charge or when', async ({ page }) => {
	const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
	expect(text).not.toMatch(/gCO|kWh|intensity/i);
	expect(text).not.toMatch(/least bad|best time|greenest|recommend|you should|charge (now|at|this|it)/i);
	// The only numbers are asset tags, times, dates (the heading, the grid's caption),
	// how many bikes a closed slot lists (DEC-78), the chart's hours (DEC-80) and,
	// on phones, how many bikes are in and out (DEC-81): no figures.
	const hours = (await page.locator('details.gm-bandchart:visible .gm-bandchart__hours').innerText()).replace(/\s+/g, ' ').trim();
	expect(hours).toBe('07 08 09 10 11 12 13 14 15 16');
	const rest = text
		.replace(hours, '') // the chart's hours
		.replace(/\bBikes in \d+ Bikes out \d+\b/, '') // DEC-81
		.replace(/\b(All )?\d+ bikes?( changes?)?\b/g, '') // slot counts, 2 bikes change
		.replace(/\b[A-Z]\d{2}\b/g, '') // asset tags, M01
		.replace(/\b\d{2}:\d{2}\b/g, '') // times, 07:30
		.replace(/\b[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2}( \d{4})?\b/g, ''); // dates, Tue 16 Jun 2026
	expect(rest).not.toMatch(/\d/);
});

test('C01 the header has the product name and the name chip; no name reads "Add your name"', async ({ page, context }) => {
	await expect(page.locator('header.gm-header')).toContainText('Charging planner');
	await expect(page.locator('.gm-name-chip')).toHaveText('Add your name');
	await expect(page.locator('.gm-name-chip')).toHaveClass(/gm-name-chip--empty/);
	await context.addCookies([{ name: 'gm_name', value: 'Dave Morgan', url: page.url() }]);
	await page.reload();
	await expect(page.locator('.gm-name-chip')).toContainText('Dave Morgan');
	// UI spec §3.1, DEC-77: the bottom tab bar at every width; no tabs in the header.
	await expect(page.locator('nav.gm-tabbar')).toBeVisible();
	await expect(page.locator('header.gm-header nav')).toHaveCount(0);
});

test('NFR-03 axe finds no WCAG 2.1 AA failures on the day plan', async ({ page }) => {
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
	expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
});
