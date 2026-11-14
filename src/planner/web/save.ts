// One save flow for every planner form (UI spec §5.3, §6):
//   1. check on the server (zod and the data dictionary rules);
//   2. find the picked name, or ask for it first and keep the change (AC-10.1);
//   3. on the public demo, save nothing and say so (DEC-49);
//   4. save; if that fails, keep everything typed (NFR-19);
//   5. redirect to the record with a notice saying what changed (C16).

import type { AstroCookies } from 'astro';
import type { Checked, Errors, Values } from '../forms/validate.ts';
import { checkName } from '../forms/validate.ts';
import { DEMO_NOT_SAVED } from '../forms/messages.ts';
import { settings } from '../server.ts';
import { pickedName, rememberName, setNotice, type Notice } from './request.ts';

/** The field the name picker adds to a replayed form. */
export const NAME_FIELD = '_name';

export type SaveOutcome =
	| { kind: 'redirect'; response: Response }
	| { kind: 'invalid'; errors: Errors }
	| { kind: 'needs-name'; nameError: string | null }
	| { kind: 'failed' };

export async function save<T>(
	astro: { cookies: AstroCookies; redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response },
	values: Values,
	steps: {
		check: () => Checked<T> | Promise<Checked<T>>;
		write: (value: T, name: string) => Promise<void>;
		saved: (value: T) => Omit<Notice, 'kind'>;
		redirectTo: (value: T) => string;
	},
): Promise<SaveOutcome> {
	const checked = await steps.check();
	if (!checked.ok) return { kind: 'invalid', errors: checked.errors };

	let name = pickedName(astro.cookies);
	if (NAME_FIELD in values) {
		const picked = checkName(values[NAME_FIELD]);
		if (!picked.ok) return { kind: 'needs-name', nameError: picked.errors.name };
		rememberName(astro.cookies, picked.value);
		name = picked.value;
	}
	if (!name) return { kind: 'needs-name', nameError: null };

	if (settings.publicDemo) {
		setNotice(astro.cookies, { kind: 'demo', ...DEMO_NOT_SAVED });
		return { kind: 'redirect', response: astro.redirect(steps.redirectTo(checked.value), 303) };
	}

	try {
		await steps.write(checked.value, name);
	} catch (error) {
		console.error(`[save] ${(error as Error).message}`);
		return { kind: 'failed' };
	}
	setNotice(astro.cookies, { kind: 'success', ...steps.saved(checked.value) });
	return { kind: 'redirect', response: astro.redirect(steps.redirectTo(checked.value), 303) };
}
