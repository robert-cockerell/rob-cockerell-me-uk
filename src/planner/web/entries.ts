// Process 3.3 Record service and fault entries (REQ-09): fault reports,
// service checks and dealer services on a bike or a battery, and clearing a
// fault. Entries are inserted; the only change is clearing a fault (BR-07).
// A dealer service can clear the bike's open faults, with its own Entry date
// and Recorded by (OI-04).

import type { AstroCookies } from 'astro';
import { toMinute } from '../fleet/asset-forms.ts';
import { historyOrder, isOpenFault } from '../fleet/derive.ts';
import type { Entry, EntryType } from '../fleet/types.ts';
import { dateLabel, SAVED } from '../fleet/wording.ts';
import { MSG } from '../forms/messages.ts';
import { checkClearedDate, checkEntry, formValues, type Checked, type Values } from '../forms/validate.ts';
import { londonDate } from '../plan/calendar.ts';
import { fleet } from '../server.ts';
import { routes } from '../ui/routes.ts';
import { clockFor } from './request.ts';
import { save, type SaveOutcome } from './save.ts';

type Astro = { request: Request; cookies: AstroCookies; redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response };
export type AssetKind = 'bikes' | 'batteries';
export type EntryPageKind = 'fault' | 'check' | 'dealer-service';

const ENTRY_TYPE: Record<EntryPageKind, EntryType> = { fault: 'fault', check: 'service check', 'dealer-service': 'dealer service' };

export const ENTRY_PAGE = {
	fault: { heading: (tag: string) => `Report a fault on ${tag}`, submit: 'Save fault', describe: "What's wrong?", dateHint: "The day you found it. Today, unless you're catching up" },
	check: { heading: (tag: string) => `Record a service check on ${tag}`, submit: 'Save service check', describe: 'What did you check?', dateHint: 'The day of the check' },
	'dealer-service': { heading: (tag: string) => `Record a dealer service on ${tag}`, submit: 'Save dealer service', describe: 'What did the dealer do?', dateHint: 'The date on the job sheet' },
};

export interface EntryView {
	asset: AssetKind;
	tag: string;
	kind: EntryPageKind;
	values: Values;
	errors: Record<string, string>;
	outcome: SaveOutcome | null;
	today: string;
	/** Dealer service: the bike's open faults it can clear. */
	openFaults: Entry[];
}

export async function handleEntry(astro: Astro, asset: AssetKind, tag: string, kind: EntryPageKind): Promise<{ response: Response } | { view: EntryView }> {
	const repo = fleet();
	const now = await clockFor(astro.cookies).now();
	const today = londonDate(now);
	const exists = asset === 'bikes' ? await repo.getBike(tag) : await repo.getBattery(tag);
	if (!exists || (kind === 'dealer-service' && asset !== 'bikes')) return { response: new Response(null, { status: 404 }) };
	const ref = asset === 'bikes' ? { bike: tag } : { battery: tag };
	const openFaults = kind === 'dealer-service' ? historyOrder((await repo.listEntries(ref)).filter(isOpenFault)) : [];

	let values: Values = { entryDate: today };
	let errors: Record<string, string> = {};
	let outcome: SaveOutcome | null = null;
	if (astro.request.method === 'POST') {
		values = formValues(await astro.request.formData());
		const entryType = ENTRY_TYPE[kind];
		outcome = await save(astro, values, {
			check: () => checkEntryForm(values, entryType, now, openFaults),
			write: async (v, name) => {
				await repo.insertEntry({
					entryType,
					entryDate: v.entryDate,
					bikeAssetTag: asset === 'bikes' ? tag : null,
					batteryAssetTag: asset === 'batteries' ? tag : null,
					description: v.description,
					recordedBy: name,
					recordedAt: toMinute(now),
				});
				// BR-07, OI-04: the dealer service's Entry date and Recorded by.
				for (const id of v.clears) await repo.clearFault(id, v.entryDate, name);
			},
			saved: (v) =>
				kind === 'fault' ? SAVED.fault(tag) : kind === 'check' ? SAVED.check(tag) : SAVED.dealer(tag, v.clears.length),
			redirectTo: () => (asset === 'bikes' ? routes.bike(tag) : routes.battery(tag)),
		});
		if (outcome.kind === 'redirect') return { response: outcome.response };
		if (outcome.kind === 'invalid') errors = outcome.errors;
	}
	return { view: { asset, tag, kind, values, errors, outcome, today, openFaults } };
}

function checkEntryForm(
	values: Values,
	entryType: EntryType,
	now: Date,
	openFaults: Entry[],
): Checked<{ entryDate: string; description: string; clears: number[] }> {
	const checked = checkEntry(values, entryType, now);
	const ids = (values.clears ?? '').split(',').filter(Boolean).map(Number);
	const clears = openFaults.filter((f) => ids.includes(f.entryId));
	const errors = checked.ok ? {} : { ...checked.errors };
	// A fault can't be cleared before it was reported (DI-027).
	const early = checked.ok ? clears.find((f) => checked.value.entryDate < f.entryDate) : undefined;
	if (early) errors.clears = MSG.clearedDateBeforeEntry(dateLabel(early.entryDate));
	if (!checked.ok || early) return { ok: false, errors };
	return { ok: true, value: { ...checked.value, clears: clears.map((f) => f.entryId) } };
}

// ------------------------------------------------------------- clearing a fault

export interface ClearView {
	fault: Entry;
	asset: { kind: AssetKind; tag: string };
	values: Values;
	errors: Record<string, string>;
	outcome: SaveOutcome | null;
	today: string;
	alreadyClosed: boolean;
}

export async function handleClear(astro: Astro, entryId: number): Promise<{ response: Response } | { view: ClearView }> {
	const repo = fleet();
	const now = await clockFor(astro.cookies).now();
	const today = londonDate(now);
	const fault = Number.isInteger(entryId) ? await repo.getEntry(entryId) : null;
	if (!fault || fault.entryType !== 'fault') return { response: new Response(null, { status: 404 }) };
	const asset = fault.bikeAssetTag ? { kind: 'bikes' as const, tag: fault.bikeAssetTag } : { kind: 'batteries' as const, tag: fault.batteryAssetTag as string };
	const record = asset.kind === 'bikes' ? routes.bike(asset.tag) : routes.battery(asset.tag);

	let values: Values = { clearedDate: today };
	let errors: Record<string, string> = {};
	let outcome: SaveOutcome | null = null;
	let alreadyClosed = !isOpenFault(fault);
	if (astro.request.method === 'POST' && !alreadyClosed) {
		values = formValues(await astro.request.formData());
		outcome = await save(astro, values, {
			check: () => checkClearedDate(values.clearedDate, fault.entryDate, dateLabel(fault.entryDate), now),
			write: async (clearedDate, name) => {
				if (!(await repo.clearFault(entryId, clearedDate, name))) alreadyClosed = true;
			},
			saved: () => SAVED.cleared(asset.tag),
			redirectTo: () => record,
		});
		if (outcome.kind === 'redirect' && !alreadyClosed) return { response: outcome.response };
		if (outcome.kind === 'invalid') errors = outcome.errors;
	}
	return { view: { fault, asset, values, errors, outcome, today, alreadyClosed } };
}
