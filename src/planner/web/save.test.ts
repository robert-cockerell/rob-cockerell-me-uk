import type { AstroCookies } from 'astro';
import { describe, expect, it } from 'vitest';
import { checkEntry, type Values } from '../forms/validate.ts';
import { save } from './save.ts';

function fakeAstro(cookies: Record<string, string> = {}) {
	const jar = new Map(Object.entries(cookies));
	const astro = {
		cookies: {
			get: (k: string) => (jar.has(k) ? { value: jar.get(k) as string } : undefined),
			set: (k: string, v: string) => void jar.set(k, v),
			delete: (k: string) => void jar.delete(k),
		} as unknown as AstroCookies,
		redirect: (path: string, status = 302) => new Response(null, { status, headers: { Location: path } }),
	};
	return { astro, jar };
}

const now = new Date('2026-06-16T11:00:00Z');
const steps = (write: () => Promise<void>, values: Values) => ({
	check: () => checkEntry(values, 'fault', now),
	write,
	saved: () => ({ title: 'Fault saved', body: 'x' }),
	redirectTo: () => '/demos/charging-planner/fleet/bikes/G02/',
});

describe('the save flow', () => {
	it('NFR-19 with the database unreachable, nothing is saved and everything typed is kept', async () => {
		const { astro, jar } = fakeAstro({ gm_name: 'Sam Patel' });
		const values: Values = { description: 'Front brake pads worn below 1.5 mm', entryDate: '2026-06-16' };
		const typed = { ...values };
		const outcome = await save(astro, values, steps(async () => { throw new Error('fetch failed: ECONNREFUSED'); }, values));
		expect(outcome).toEqual({ kind: 'failed' });
		// The page shows the form again from these values, with "Nothing was saved".
		expect(values).toEqual(typed);
		expect(jar.has('gm_flash')).toBe(false);
	});

	it('AC-10.1 with no name picked, it asks for one before saving; with the name, it saves and remembers it', async () => {
		const values: Values = { description: 'Kickstand loose', entryDate: '2026-06-16' };
		let writtenBy: string | null = null;
		const first = fakeAstro();
		expect(await save(first.astro, values, steps(async () => {}, values))).toEqual({ kind: 'needs-name', nameError: null });

		const second = fakeAstro();
		const withName = { ...values, _name: 'Aisha Bello' };
		const outcome = await save(second.astro, withName, { ...steps(async () => {}, withName), write: async (_v, name) => { writtenBy = name; } });
		expect(outcome.kind).toBe('redirect');
		expect(writtenBy).toBe('Aisha Bello');
		expect(second.jar.get('gm_name')).toBe('Aisha Bello');
	});

	it('checks before asking for a name: a missing description is reported first', async () => {
		const values: Values = { description: '', entryDate: '2026-06-16' };
		const outcome = await save(fakeAstro().astro, values, steps(async () => {}, values));
		expect(outcome).toEqual({ kind: 'invalid', errors: { description: 'Enter a description of the fault' } });
	});
});
