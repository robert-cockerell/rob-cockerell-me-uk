// CRP script S5 – Brake fault (REQ-02, REQ-09, REQ-10) and S6 – Dealer
// service (REQ-09, AC-10.5). Starting state: R0, clock 12:00.

import { expect, test, type Page } from '@playwright/test';
import { errorMessages, history, notice, pickName, statesOf, text, url } from './helpers.ts';
import { latestEntry, setClock, setStartingState, standinEvent } from './stand-in.ts';

test.beforeAll(async () => setStartingState('R0', '2026-06-16 12:00'));

async function reportFault(page: Page, path: string, description: string, date?: string) {
	await page.goto(`${path}fault/`);
	await page.locator('[name="description"]').fill(description);
	if (date !== undefined) await page.locator('[name="entryDate"]').fill(date);
	await page.getByRole('button', { name: 'Save fault' }).click();
}

test('S5.01 AC-10.3 the tablet showing "Dave Morgan" is changed to "Sam Patel" from the name chip', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Dave Morgan');
	await page.goto(url.dayPlan);
	await page.locator('.gm-name-chip').click();
	await page.locator('[name="_name"]').fill('Sam Patel');
	await page.getByRole('button', { name: 'Save name and continue' }).click();
	await expect(page).toHaveURL(url.dayPlan);
	await expect(page.locator('.gm-name-chip')).toContainText('Sam Patel');
});

test.describe('Sam', () => {
	test.beforeEach(async ({ context, baseURL }) => pickName(context, baseURL, 'Sam Patel'));

	test('S5.02 AC-09.1 AC-10.4 G02 fault saved open, dated today, Recorded by Sam Patel at now', async ({ page }) => {
		await page.goto(`${url.bike('G02')}fault/`);
		// AC-09.6: Entry date defaults to today.
		await expect(page.locator('[name="entryDate"]')).toHaveValue('2026-06-16');
		await page.locator('[name="description"]').fill('Front brake pads worn below 1.5 mm');
		await page.getByRole('button', { name: 'Save fault' }).click();
		await expect(page).toHaveURL(url.bike('G02'));
		expect(await notice(page)).toContain('Fault saved');
		const top = (await history(page))[0].text;
		expect(top).toContain('Fault open');
		expect(top).toContain('Front brake pads worn below 1.5 mm');
		expect(top).toContain('Recorded by Sam Patel, 16 Jun 2026 12:00');
		const e = await latestEntry({ bike: 'G02' });
		expect([e.entry_type, e.entry_date, e.cleared_date, e.cleared_by, e.recorded_by]).toEqual(['fault', '2026-06-16', null, null, 'Sam Patel']);
		await expect(page.locator('.gm-summary .gm-flag--fault')).toHaveText('Open fault');
	});

	test('S5.03 AC-09.6 V-12 V-13 V-15 nothing saved; the message names the item', async ({ page }) => {
		const before = (await latestEntry({ bike: 'G02' })).entry_id;
		await reportFault(page, url.bike('G02'), '');
		expect(await errorMessages(page)).toEqual(['Enter a description of the fault']);
		await reportFault(page, url.bike('G02'), 'Test', '2026-06-17');
		expect(await errorMessages(page)).toEqual(["Entry date can't be in the future"]);
		await expect(page.locator('[name="description"]')).toHaveValue('Test');
		expect((await latestEntry({ bike: 'G02' })).entry_id).toBe(before);
		await page.goto(`${url.bike('M03')}check/`);
		await page.getByRole('button', { name: 'Save service check' }).click();
		expect(await errorMessages(page)).toEqual(['Enter what you checked']);
	});

	test('S5.04 AC-09.7 G02 with an open fault, still available in LibreBooking, isn\'t "Out of service"', async ({ page }) => {
		await page.goto(url.dayPlan);
		expect(Object.values(await statesOf(page, 'G02'))).not.toContain('Out of service');
	});

	test('S5.07 AC-02.1 after E-04, G02 and G05 read "Out of service" in every slot', async ({ page }) => {
		await standinEvent('E-04');
		await page.goto(url.dayPlan);
		expect(new Set(Object.values(await statesOf(page, 'G02')))).toEqual(new Set(['Out of service']));
		expect(new Set(Object.values(await statesOf(page, 'G05')))).toEqual(new Set(['Out of service']));
	});

	test('S5.08 AC-09.4 a service check on M03 is saved with no Cleared date or Cleared by', async ({ page }) => {
		await page.goto(`${url.bike('M03')}check/`);
		await page.locator('[name="description"]').fill('Rear tyre low, pumped up');
		await page.getByRole('button', { name: 'Save service check' }).click();
		await expect(page).toHaveURL(url.bike('M03'));
		const e = await latestEntry({ bike: 'M03' });
		expect([e.entry_type, e.description, e.cleared_date, e.cleared_by]).toEqual(['service check', 'Rear tyre low, pumped up', null, null]);
	});

	test('S5.09 AC-02.7 M07 reads "Out of service" while unavailable, then "In the workshop"; the tool can\'t set availability', async ({ page }) => {
		await standinEvent('E-05');
		await page.goto(url.dayPlan);
		expect(new Set(Object.values(await statesOf(page, 'M07')))).toEqual(new Set(['Out of service']));
		for (const path of [url.dayPlan, url.bike('M07'), `${url.bike('M07')}edit/`]) {
			await page.goto(path);
			await expect(page.locator('main')).not.toContainText(/unavailable|availability|set .*status/i);
		}
		await standinEvent('E-06');
		await page.goto(url.dayPlan);
		expect(new Set(Object.values(await statesOf(page, 'M07')))).toEqual(new Set(['In the workshop']));
	});
});

test('S5.10 S5.11 AC-10.2 next day, Aisha isn\'t asked for her name; her fault on G06 carries "Aisha Bello"', async ({ page, context, baseURL }) => {
	await setClock('2026-06-17 09:00');
	await pickName(context, baseURL, 'Aisha Bello');
	await reportFault(page, url.bike('G06'), 'Kickstand loose');
	await expect(page).toHaveURL(url.bike('G06'));
	const e = await latestEntry({ bike: 'G06' });
	expect([e.recorded_by, e.entry_date]).toEqual(['Aisha Bello', '2026-06-17']);
});

test('S5.12 AC-09.3 AC-10.4 G02\'s fault: V-16 and V-17 refused; cleared on 17 June by Sam Patel, closed, no longer offered', async ({ page, context, baseURL }) => {
	await setClock('2026-06-17 09:00');
	await pickName(context, baseURL, 'Sam Patel');
	const fault = await latestEntry({ bike: 'G02' });
	const clear = async (date: string) => {
		await page.goto(`${url.fleet}faults/${fault.entry_id}/clear/`);
		await page.locator('[name="clearedDate"]').fill(date);
		await page.getByRole('button', { name: 'Clear fault' }).click();
	};
	await clear('2026-06-15');
	expect(await errorMessages(page)).toEqual(["Cleared date can't be before the fault was reported (16 Jun 2026)"]);
	await clear('2026-06-18');
	expect(await errorMessages(page)).toEqual(["Cleared date can't be in the future"]);
	await clear('2026-06-17');
	await expect(page).toHaveURL(url.bike('G02'));
	const item = (await history(page)).find((h) => h.id === fault.entry_id)!.text;
	expect(item).toContain('Fault closed');
	expect(item).toContain('Cleared 17 Jun 2026 by Sam Patel');
	expect(item).not.toContain('Clear this fault');
	await page.goto(`${url.fleet}faults/${fault.entry_id}/clear/`);
	await expect(page.locator('main h1')).toHaveText('This fault is closed');
});

test('S6.01 AC-09.5 AC-10.5 dealer service on M07 clears 1043 with its Entry date and Priya\'s name; shows Entry date and Recorded at', async ({ page, context, baseURL }) => {
	await setClock('2026-06-16 16:12');
	await pickName(context, baseURL, 'Priya Shah');
	await page.goto(`${url.bike('M07')}dealer-service/`);
	await page.locator('[name="entryDate"]').fill('2026-06-15');
	await page.locator('[name="description"]').fill('Interim: new rear light, brake bleed');
	await page.locator('#clear-1043').check();
	await page.getByRole('button', { name: 'Save dealer service' }).click();
	await expect(page).toHaveURL(url.bike('M07'));
	const items = await history(page);
	const service = items.find((h) => h.text.startsWith('Dealer service') && h.text.includes('new rear light'))!.text;
	expect(service).toContain('15 Jun 2026');
	expect(service).toContain('Recorded by Priya Shah, 16 Jun 2026 16:12');
	const f1043 = items.find((h) => h.id === 1043)!.text;
	expect(f1043).toContain('Fault closed');
	expect(f1043).toContain('Cleared 15 Jun 2026 by Priya Shah');
	await expect(page.locator('.gm-summary .gm-flag--fault')).toHaveCount(0);
	// S6.06: the last service is now the dealer service (DEC-38).
	expect(await text(page.locator('.gm-summary__fact', { hasText: 'Last service' }).locator('dd'))).toBe('Dealer service, 15 Jun 2026');
});

test('NFR-17 a description containing <script> is shown as text', async ({ page, context, baseURL }) => {
	await pickName(context, baseURL, 'Sam Patel');
	let ran = false;
	page.on('dialog', async (d) => { ran = true; await d.dismiss(); });
	await reportFault(page, url.bike('G03'), '<script>alert(1)</script> chain slipping');
	await expect(page).toHaveURL(url.bike('G03'));
	expect((await history(page))[0].text).toContain('<script>alert(1)</script> chain slipping');
	expect(ran).toBe(false);
});

test('NFR-17 a form post from another site is rejected', async ({ request, baseURL }) => {
	const res = await request.post(`${baseURL}${url.bike('G03')}fault/`, {
		headers: { Origin: 'https://example.org', 'Content-Type': 'application/x-www-form-urlencoded' },
		data: 'description=from+elsewhere&entryDate=2026-06-16',
		maxRedirects: 0,
	});
	expect(res.status()).toBe(403);
});
