// CRP script S10 – New batteries and a new bike (REQ-06, REQ-10, AC-02.8).
// Starting state: R0, clock 09:30. Priya's device remembers "Priya Shah";
// Aisha's has no name yet (AC-10.1).

import { expect, test, type Page } from '@playwright/test';
import { bikeRow, errorMessages, expectNoAxeFailures, expectNoSidewaysScroll, fact, notice, pickName, statesOf, text, url } from './helpers.ts';
import { setStartingState } from './stand-in.ts';

test.beforeAll(async () => setStartingState('R0', '2026-06-16 09:30'));

async function addBike(page: Page, fields: Record<string, string>) {
	await page.goto(`${url.fleet}bikes/new/`);
	const all = { bikeAssetTag: 'G08', librebookingResourceId: '120', make: 'Tern', model: 'GSD Gen 3', frameSize: '', bikeSerialNumber: '', bikePurchaseDate: '', ...fields };
	for (const [name, value] of Object.entries(all)) await page.locator(`[name="${name}"]`).fill(value);
	await page.getByRole('button', { name: 'Save bike' }).click();
}

async function addBattery(page: Page, fields: Record<string, string>) {
	await page.goto(`${url.batteries}new/`);
	const { batteryType = 'Bosch PowerPack 500', ...rest } = fields;
	const all = { batteryAssetTag: 'B-29', boschSerial: '', batteryPurchaseDate: '', cycleCount: '', ...rest };
	for (const [name, value] of Object.entries(all)) await page.locator(`[name="${name}"]`).fill(value);
	await page.locator('[name="batteryType"]').selectOption(batteryType === '(blank)' ? '' : batteryType);
	await page.getByRole('button', { name: 'Save battery' }).click();
}

test.describe('Priya', () => {
	test.beforeEach(async ({ context, baseURL }) => pickName(context, baseURL, 'Priya Shah'));

	test('S10.01 AC-06.1 AC-10.4 G07 added with Last updated by Priya Shah and now; it\'s in the bike list', async ({ page }) => {
		await addBike(page, { bikeAssetTag: 'G07', librebookingResourceId: '119', make: 'Tern', model: 'GSD Gen 3', bikeSerialNumber: 'TN-GSD3-26007', bikePurchaseDate: '2026-06-15' });
		await expect(page).toHaveURL(url.bike('G07'));
		expect(await notice(page)).toContain('Bike added');
		expect(await text(page.locator('.gm-summary__stamp'))).toBe('Last updated by Priya Shah, 16 Jun 2026 09:30');
		expect(await fact(page, 'Frame size')).toBe('One size');
		await page.goto(url.fleet);
		await expect(page.locator('.gm-list__row', { hasText: 'G07' })).toHaveCount(1);
	});

	const cases: [string, Record<string, string>, RegExp][] = [
		['V-01', { bikeAssetTag: '' }, /^Enter the asset tag$/],
		['V-02', { bikeAssetTag: 'M01' }, /Asset tag M01 is already used/],
		['V-03', { bikeAssetTag: 'G7' }, /asset tag as a letter and 2 numbers/],
		['V-04', { librebookingResourceId: '101' }, /Resource ID 101 is already used by M01/],
		['V-05', { librebookingResourceId: 'abc' }, /LibreBooking resource ID as a whole number/],
		['V-06', { model: '' }, /^Enter the model$/],
		['V-07', { bikePurchaseDate: '2026-06-17' }, /Bike purchase date can't be in the future/],
	];
	for (const [id, fields, message] of cases) {
		test(`S10.02 AC-06.2 ${id} nothing saved; the message names the item`, async ({ page }) => {
			await addBike(page, fields);
			await expect(page).toHaveURL(`${url.fleet}bikes/new/`);
			const errors = await errorMessages(page);
			expect(errors).toHaveLength(1);
			expect(errors[0]).toMatch(message);
			// Everything typed is kept (NFR-19, UI spec §5.3).
			await expect(page.locator('[name="make"]')).toHaveValue(fields.make ?? 'Tern');
			await page.goto(url.bike('G08'));
			await expect(page.locator('main h1')).toHaveText('Bike not found');
		});
	}

	const batteryCases: [string, Record<string, string>, RegExp][] = [
		['V-08', { batteryAssetTag: 'B-05' }, /Asset tag B-05 is already used/],
		['V-09', { batteryAssetTag: 'B27' }, /asset tag as B- and 2 numbers/],
		['V-10', { batteryType: '(blank)' }, /^Choose a battery type$/],
		['V-11', { cycleCount: '-1' }, /cycle count from 0 to 9,999/],
	];
	for (const [id, fields, message] of batteryCases) {
		test(`S10.02 AC-06.2 ${id} nothing saved; the message names the item`, async ({ page }) => {
			await addBattery(page, fields);
			expect(await errorMessages(page)).toEqual([expect.stringMatching(message)]);
			await page.goto(url.battery('B-29'));
			await expect(page.locator('main h1')).toHaveText('Battery not found');
		});
	}

	test('NFR-03 axe finds no WCAG 2.1 AA failures on a form showing errors', async ({ page }) => {
		await addBike(page, { bikeAssetTag: 'G7', model: '' });
		await expect(page).toHaveTitle(/^Error: Add a bike/);
		await expect(page.locator('.gm-error-summary')).toBeFocused();
		await expect(page.locator('#f-bikeAssetTag')).toHaveAttribute('aria-invalid', 'true');
		await expectNoSidewaysScroll(page);
		await expectNoAxeFailures(page);
	});

	test('S10.04 AC-06.5 no availability or status field and no delete action on any add or edit screen', async ({ page }) => {
		for (const path of [`${url.fleet}bikes/new/`, `${url.bike('M07')}edit/`, `${url.batteries}new/`, `${url.battery('B-07')}edit/`, `${url.types}new/`, `${url.type('Bosch PowerTube 500')}edit/`]) {
			await page.goto(path);
			const form = await text(page.locator('main'));
			expect(form, path).not.toMatch(/status|availab|delete|remove|retire/i);
		}
	});

	test('S10.05 AC-06.3 battery type "Bosch PowerPack 545" with no capacity is saved', async ({ page }) => {
		await page.goto(`${url.types}new/`);
		await page.locator('[name="batteryType"]').fill('Bosch PowerPack 545');
		await page.getByRole('button', { name: 'Save battery type' }).click();
		await expect(page).toHaveURL(url.type('Bosch PowerPack 545'));
	});
});

test.describe('Aisha', () => {
	test('S10.07 AC-06.3 AC-10.1 AC-06.6 B-27: the list offers PowerPack 545; on saving she\'s asked for her name first, and B-27 is saved with it', async ({ page }) => {
		await page.goto(`${url.batteries}new/`);
		await expect(page.locator('[name="batteryType"] option', { hasText: 'Bosch PowerPack 545' })).toHaveCount(1);
		await addBattery(page, { batteryAssetTag: 'B-27', batteryType: 'Bosch PowerPack 500', boschSerial: '4471937027', batteryPurchaseDate: '2026-06-16' });
		await expect(page.getByRole('heading', { name: "Who's using this device?" })).toBeVisible();
		await page.locator('[name="_name"]').fill('Aisha Bello');
		await page.getByRole('button', { name: 'Save name and continue' }).click();
		await expect(page).toHaveURL(url.battery('B-27'));
		expect(await text(page.locator('.gm-summary__stamp'))).toBe('Last updated by Aisha Bello, 16 Jun 2026 09:30');
		await expect(page.locator('.gm-name-chip')).toContainText('Aisha Bello');

		// S10.08: not asked again.
		await addBattery(page, { batteryAssetTag: 'B-28', batteryType: 'Bosch PowerPack 500', boschSerial: '4471937028', batteryPurchaseDate: '2026-06-16' });
		await expect(page).toHaveURL(url.battery('B-28'));
		expect(await text(page.locator('.gm-summary__stamp'))).toContain('Aisha Bello');

		// S10.09 AC-08.4: never fitted, so on the shelf. Both B-27 and B-28.
		await expect(page.locator('.gm-summary .gm-location')).toHaveText('On the shelf');
		await page.goto(url.battery('B-27'));
		await expect(page.locator('.gm-summary .gm-location')).toHaveText('On the shelf');
	});

	test('S10.10 AC-06.3 Bosch PowerPack 545 reads capacity "Not recorded"', async ({ page }) => {
		await page.goto(url.type('Bosch PowerPack 545'));
		expect(await fact(page, 'Capacity')).toBe('Not recorded');
	});
});

test.describe('Priya edits resource IDs', () => {
	test.beforeEach(async ({ context, baseURL }) => pickName(context, baseURL, 'Priya Shah'));

	async function setResourceId(page: Page, bike: string, id: string) {
		await page.goto(`${url.bike(bike)}edit/`);
		await page.locator('[name="librebookingResourceId"]').fill(id);
		await page.getByRole('button', { name: 'Save bike' }).click();
		await expect(page).toHaveURL(url.bike(bike));
	}

	test('S10.11 AC-02.8 BR-12 M12 with resource ID 199 reads "Out of service" with a mismatch warning; back to 112, "In the workshop"', async ({ page }) => {
		await setResourceId(page, 'M12', '199');
		await page.goto(url.dayPlan);
		expect(new Set(Object.values(await statesOf(page, 'M12')))).toEqual(new Set(['Out of service']));
		expect((await bikeRow(page, 'M12')).flags).toEqual(["Resource ID doesn't match LibreBooking"]);
		await setResourceId(page, 'M12', '112');
		await page.goto(url.dayPlan);
		expect(new Set(Object.values(await statesOf(page, 'M12')))).toEqual(new Set(['In the workshop']));
	});

	test('S10.12 AC-06.4 AC-10.4 M07 corrected from 170 to 107 shows the new ID, Priya and now, and is back on the day plan', async ({ page }) => {
		await setResourceId(page, 'M07', '170');
		await setResourceId(page, 'M07', '107');
		expect(await fact(page, 'LibreBooking resource ID')).toBe('107');
		expect(await text(page.locator('.gm-summary__stamp'))).toBe('Last updated by Priya Shah, 16 Jun 2026 09:30');
		await page.goto(url.dayPlan);
		expect(new Set(Object.values(await statesOf(page, 'M07')))).toEqual(new Set(['In the workshop']));
		expect((await bikeRow(page, 'M07')).next).toBe('next out: Wed 10:00');
	});
});
