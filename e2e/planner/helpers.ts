// Shared browser-test helpers for the charging planner.

import AxeBuilder from '@axe-core/playwright';
import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test';

export const BASE = '/demos/charging-planner';
export const url = {
	dayPlan: `${BASE}/`,
	/** DEC-82: the phone day plan's "All day" view (the grid is always all day). */
	dayPlanAll: `${BASE}/?view=all`,
	fleet: `${BASE}/fleet/`,
	batteries: `${BASE}/fleet/batteries/`,
	types: `${BASE}/fleet/battery-types/`,
	bike: (t: string) => `${BASE}/fleet/bikes/${t}/`,
	battery: (t: string) => `${BASE}/fleet/batteries/${t}/`,
	type: (n: string) => `${BASE}/fleet/battery-types/${encodeURIComponent(n)}/`,
};

/** The device remembers a picked name (REQ-10), as after SU.07. */
export async function pickName(context: BrowserContext, baseURL: string | undefined, name: string) {
	// Same path as the server's cookie, so a later change replaces it.
	const { hostname } = new URL(baseURL ?? 'http://localhost');
	await context.addCookies([{ name: 'gm_name', value: name, domain: hostname, path: BASE, httpOnly: true, sameSite: 'Lax' }]);
}

export const text = async (l: Locator) => ((await l.innerText()) ?? '').replace(/\s+/g, ' ').trim();

/** The notice left by the last save (C16): after the public demo's banner, if there is one. */
export async function notice(page: Page): Promise<string> {
	return text(page.locator('.gm-notice').last());
}

/** A record's fact, by its label (C09). */
export async function fact(page: Page, label: string): Promise<string> {
	return text(page.locator('.gm-summary__fact').filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd'));
}

/** History items, top to bottom (C10). */
export async function history(page: Page) {
	return page.$$eval('.gm-history__item', (items) =>
		items.map((i) => ({
			id: Number(i.id.replace('entry-', '')),
			text: (i.textContent ?? '').replace(/\s+/g, ' ').trim(),
		})),
	);
}

/** The error summary's messages (C13). */
export async function errorMessages(page: Page): Promise<string[]> {
	// Wait for the posted form to come back; every caller starts from a fresh form.
	await page.locator('.gm-error-summary').waitFor({ state: 'visible' });
	return (await page.locator('.gm-error-summary li').allInnerTexts()).map((t) => t.trim());
}

/** NFR-02: no sideways page scrolling. */
export async function expectNoSidewaysScroll(page: Page) {
	const { scrollWidth, clientWidth } = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth,
	}));
	expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

/** NFR-03: axe, WCAG 2.1 AA. */
export async function expectNoAxeFailures(page: Page) {
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
	expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help} (${v.nodes[0]?.target})`)).toEqual([]);
}

/** NFR-01, brand §7: a control at least 44 × 44 CSS px. */
export async function expectTapTarget(l: Locator) {
	const box = await l.boundingBox();
	expect(box, 'control is on screen').not.toBeNull();
	expect(box!.width).toBeGreaterThanOrEqual(44);
	expect(box!.height).toBeGreaterThanOrEqual(44);
}

/** The bike rows in a day plan slot, as "TAG state text". */
export async function slotRows(page: Page, time: string): Promise<Record<string, string>> {
	const rows = await page
		.locator('li.gm-slot', { has: page.locator(`time.gm-slot__time`, { hasText: time }) })
		.locator('a.gm-bike-row')
		.evaluateAll((els) => els.map((e) => [e.querySelector('.gm-bike-row__tag')?.textContent?.trim() ?? '', (e.textContent ?? '').replace(/\s+/g, ' ').trim()]));
	return Object.fromEntries(rows);
}

/** True when the day plan shows the grid (992 px and wider, UI spec §3.3). */
export async function showsGrid(page: Page): Promise<boolean> {
	return page.locator('.gm-print-grid').isVisible();
}

/** A bike's state in every slot: from the grid when it's shown, else from the timeline's change lists. */
export async function statesOf(page: Page, bike: string): Promise<Record<string, string>> {
	if (await showsGrid(page)) {
		return page.locator('table.gm-grid').evaluate((table, tag) => {
			const times = [...table.querySelectorAll('thead th .gm-grid__time')].map((t) => t.textContent?.trim() ?? '');
			const row = [...table.querySelectorAll('tbody tr')].find((r) => r.querySelector('th .gm-mono')?.textContent?.trim() === tag);
			const out: Record<string, string> = {};
			[...(row?.querySelectorAll('td') ?? [])].forEach((td, i) => {
				const shown = td.querySelector('.gm-grid__cell') ?? td.querySelector('.visually-hidden');
				out[times[i]] = (shown?.textContent ?? '').replace(/\s+/g, ' ').replace(', due', ' due').trim();
			});
			return out;
		}, bike);
	}
	const slots = await page.$$eval('ol.gm-timeline > li.gm-slot', (els) =>
		els.map((s) => ({
			time: s.querySelector('time')?.textContent?.trim() ?? '',
			rows: [...s.querySelectorAll('a.gm-bike-row')].map((r) => ({
				tag: r.querySelector('.gm-bike-row__tag')?.textContent?.trim() ?? '',
				state: (r.querySelector('.gm-state')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
			})),
		})),
	);
	const out: Record<string, string> = {};
	let current = '';
	for (const s of slots) {
		const row = s.rows.find((r) => r.tag === bike);
		if (row) current = row.state;
		out[s.time] = current;
	}
	return out;
}

/** A bike's next booking and flags, from the grid's row header or the timeline. */
export async function bikeRow(page: Page, bike: string) {
	const grid = await showsGrid(page);
	return page.evaluate(
		({ bike, grid }) => {
			const clean = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();
			const el = grid
				? [...document.querySelectorAll('table.gm-grid tbody th')].find((th) => clean(th.querySelector('.gm-mono')?.textContent) === bike)
				: [...document.querySelectorAll('a.gm-bike-row')].find((r) => clean(r.querySelector('.gm-bike-row__tag')?.textContent) === bike);
			return {
				next: clean(el?.querySelector('.gm-next')?.textContent),
				flags: [...(el?.querySelectorAll('.gm-flag') ?? [])].map((f) => clean(f.textContent)),
			};
		},
		{ bike, grid },
	);
}
