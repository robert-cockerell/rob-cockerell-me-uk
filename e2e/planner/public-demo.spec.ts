// Public demo mode (DEC-49, DEC-61, NFR-13, X-13), on the server started with
// GM_PUBLIC_DEMO=true. Readers can open every screen and fill in every form;
// nothing is saved; each reader moves only their own demo clock.

import { expect, test } from '@playwright/test';
import { errorMessages, history, notice, pickName, url } from './helpers.ts';
import { latestEntry, setStartingState } from './stand-in.ts';

test.describe.configure({ mode: 'serial' });
// The shared demo clock is set somewhere a reader never starts.
test.beforeAll(async () => setStartingState('R0', '2026-12-08 07:00'));

test('C16 every page carries the demo notice', async ({ page }) => {
	for (const path of [url.dayPlan, url.fleet, url.bike('M07'), `${url.bike('M07')}fault/`]) {
		await page.goto(path);
		const demo = page.locator('.gm-notice--demo');
		await expect(demo.locator('.gm-notice__title')).toHaveText('This is a demo');
		await expect(demo).toContainText("Greener Miles is a made-up e-bike library. You can try everything, but changes aren't saved.");
	}
});

test('DEC-61 a reader starts at Tue 16 June 2026 07:00, whatever the shared demo clock says', async ({ page }) => {
	await page.goto(url.dayPlan);
	await expect(page.locator('.gm-page-head__sub')).toHaveText('Tue 16 Jun');
	await expect(page.locator('li.gm-slot--now time')).toHaveText('07:00');
});

test('DEC-61 a reader moves only their own clock', async ({ page, browser }) => {
	await page.goto(url.dayPlan);
	await page.locator('.gm-notice--demo').getByRole('link', { name: 'Change the demo date and time' }).click();
	await page.locator('[name="date"]').selectOption('2026-03-30');
	await page.locator('[name="time"]').fill('09:00');
	await page.getByRole('button', { name: 'Set the demo time' }).click();
	await expect(page).toHaveURL(url.dayPlan);
	await expect(page.locator('.gm-page-head__sub')).toHaveText('Mon 30 Mar');
	// At 09:00 "Rest of day" starts at 09:00 (DEC-82): read the morning in "All day".
	await page.goto(url.dayPlanAll);
	const bands = await page.locator('.gm-slot__band .gm-band').allInnerTexts();
	expect(bands.slice(0, 3).map((b) => b.trim())).toEqual(['very low', 'very low', 'moderate']);

	// Another reader still starts at 16 June.
	const other = await browser.newContext({ baseURL: test.info().project.use.baseURL });
	const otherPage = await other.newPage();
	await otherPage.goto(url.dayPlan);
	await expect(otherPage.locator('.gm-page-head__sub')).toHaveText('Tue 16 Jun');
	await other.close();

	// And the shared demo clock hasn't moved.
	const clock = await (await page.request.get('/demos/charging-planner/stand-in/clock')).json();
	expect(clock.local).toBe('2026-12-08 07:00');
});

test('X-13 forms are checked, but choosing save saves nothing and says so', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Dave Morgan');
	const before = await latestEntry({ bike: 'M07' });
	await page.goto(`${url.bike('M07')}fault/`);
	await page.getByRole('button', { name: 'Save fault' }).click();
	expect(await errorMessages(page)).toEqual(['Enter a description of the fault']);
	await page.locator('[name="description"]').fill('Bell missing again');
	await page.getByRole('button', { name: 'Save fault' }).click();
	await expect(page).toHaveURL(url.bike('M07'));
	expect(await notice(page)).toContain("This is a demo, so changes aren't saved");
	expect((await latestEntry({ bike: 'M07' })).entry_id).toBe(before.entry_id);
	expect((await history(page)).map((h) => h.text).join(' ')).not.toContain('Bell missing again');
});

test('X-13 a swap on the public demo saves nothing', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Dave Morgan');
	await page.goto(`${url.bike('G01')}swap/`);
	await page.getByRole('button', { name: 'Save swap' }).click();
	expect(await notice(page)).toContain("This is a demo, so changes aren't saved");
	await expect(page.locator('.gm-summary__fact', { hasText: 'Battery fitted' })).toContainText('B-14');
});

test('DEC-49 the tester console is off on the public demo', async ({ page }) => {
	const res = await page.goto('/demos/charging-planner/stand-in/console');
	expect(res?.status()).not.toBe(200);
	await expect(page.locator('body')).not.toContainText(/reset|request log/i);
});
