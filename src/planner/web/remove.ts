// SCR-08 Remove a battery without fitting another (REQ-08, DEC-20): saves a
// fitting with no bike. Started from the bike or the battery. Pages call this
// and return its response when there is one.

import type { AstroCookies } from 'astro';
import { currentBattery, fittedTo, isQuarantined } from '../fleet/derive.ts';
import { saveFitting } from '../fleet/fitting.ts';
import { localInputValue, SAVED } from '../fleet/wording.ts';
import { checkFittedFrom, formValues, type Values } from '../forms/validate.ts';
import { fleet } from '../server.ts';
import { routes } from '../ui/routes.ts';
import { clockFor } from './request.ts';
import { save, type SaveOutcome } from './save.ts';

export interface RemoveView {
	from: 'bike' | 'battery';
	tag: string;
	battery: string | null;
	bike: string | null;
	quarantined: boolean;
	back: { href: string; label: string };
	values: Values;
	errors: Record<string, string>;
	outcome: SaveOutcome | null;
	max: string;
}

export async function handleRemove(
	astro: { request: Request; cookies: AstroCookies; redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response },
	from: 'bike' | 'battery',
	tag: string,
): Promise<{ response: Response } | { view: RemoveView }> {
	const repo = fleet();
	const now = await clockFor(astro.cookies).now();
	const [fittings, openFaults] = await Promise.all([repo.listFittings(), repo.listOpenFaults()]);
	const battery = from === 'bike' ? currentBattery(tag, fittings) : tag;
	const bike = from === 'bike' ? tag : fittedTo(tag, fittings);
	const back = from === 'bike' ? { href: routes.bike(tag), label: tag } : { href: routes.battery(tag), label: tag };
	const quarantined = battery ? isQuarantined(battery, openFaults) : false;

	let values: Values = { fittedFrom: localInputValue(now) };
	let errors: Record<string, string> = {};
	let outcome: SaveOutcome | null = null;
	if (astro.request.method === 'POST' && battery && bike) {
		values = formValues(await astro.request.formData());
		outcome = await save(astro, values, {
			check: () => checkFittedFrom(values.fittedFrom, now),
			write: (fittedFrom, name) => saveFitting(repo, { battery, bike: null, fittedFrom }, name, now),
			saved: () => SAVED.removed(battery, bike, quarantined),
			redirectTo: () => back.href,
		});
		if (outcome.kind === 'redirect') return { response: outcome.response };
		if (outcome.kind === 'invalid') errors = outcome.errors;
	}
	return { view: { from, tag, battery, bike, quarantined, back, values, errors, outcome, max: localInputValue(now) } };
}
