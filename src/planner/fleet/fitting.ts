// Process 3.2 Record battery fitting (REQ-07, REQ-08, REQ-11). A swap or a
// removal adds a fitting; earlier fittings never change (BR-07). No
// compatibility or duplicate check (DEC-06). A quarantined battery is warned
// about before saving, never blocked (BR-06). Nothing goes to LibreBooking
// (AC-07.6).

import { MSG } from '../forms/messages.ts';
import { checkFittedFrom, type Checked, type Values } from '../forms/validate.ts';
import { toMinute } from './asset-forms.ts';
import { batteryLocation, currentBattery, isOpenFault } from './derive.ts';
import type { FleetRepo } from './repo.ts';
import type { Battery, BatteryLocation, Bike, Entry, Fitting } from './types.ts';
import { locationLabel } from './wording.ts';

export interface PickerOption {
	value: string;
	tag: string;
	detail: string;
	note: string;
	quarantined: boolean;
}

/** C11: batteries on the shelf first, then quarantined, then fitted to another bike. */
export function batteryOptions(batteries: Battery[], fittings: Fitting[], openFaults: Entry[], forBike: string): PickerOption[] {
	const rank = (l: BatteryLocation) => (l.kind === 'shelf' ? 0 : l.kind === 'quarantined' ? 1 : 2);
	return batteries
		.map((b) => ({ b, location: batteryLocation(b.batteryAssetTag, fittings, openFaults) }))
		.filter(({ location }) => !(location.kind === 'fitted' && location.bikeAssetTag === forBike))
		.sort((x, y) => rank(x.location) - rank(y.location) || x.b.batteryAssetTag.localeCompare(y.b.batteryAssetTag))
		.map(({ b, location }) => ({
			value: b.batteryAssetTag,
			tag: b.batteryAssetTag,
			detail: b.batteryType,
			note: locationLabel(location),
			quarantined: location.kind === 'quarantined',
		}));
}

/** Bikes to fit a battery to, by asset tag, with what each has fitted now. */
export function bikeOptions(bikes: Bike[], fittings: Fitting[], forBattery: string): PickerOption[] {
	return bikes.map((b) => {
		const fitted = currentBattery(b.bikeAssetTag, fittings);
		return {
			value: b.bikeAssetTag,
			tag: b.bikeAssetTag,
			detail: `${b.make} ${b.model}`,
			note: fitted === forBattery ? 'Fitted now' : fitted ? `Has ${fitted}` : 'No battery fitted',
			quarantined: false,
		};
	});
}

export interface FitChoice {
	battery: string;
	bike: string;
	fittedFrom: Date;
}

/** Check a swap (from a bike) or a fit (from a battery). */
export function checkFit(
	values: Values,
	ctx: { now: Date; bike?: string; battery?: string; bikes: Bike[]; batteries: Battery[] },
): Checked<FitChoice> {
	const battery = ctx.battery ?? values.battery ?? '';
	const bike = ctx.bike ?? values.bike ?? '';
	const errors: Record<string, string> = {};
	if (!ctx.batteries.some((b) => b.batteryAssetTag === battery)) errors.battery = MSG.chooseBattery;
	if (!ctx.bikes.some((b) => b.bikeAssetTag === bike)) errors.bike = MSG.chooseBike;
	const time = checkFittedFrom(values.fittedFrom, ctx.now);
	if (!time.ok) Object.assign(errors, time.errors);
	if (Object.keys(errors).length || !time.ok) return { ok: false, errors };
	return { ok: true, value: { battery, bike, fittedFrom: time.value } };
}

/** BR-06: the open fault that quarantines this battery, if any. */
export function quarantineFault(battery: string, entries: Entry[]): Entry | null {
	return entries.filter((e) => e.batteryAssetTag === battery && isOpenFault(e)).sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1))[0] ?? null;
}

export async function saveFitting(repo: FleetRepo, f: { battery: string; bike: string | null; fittedFrom: Date }, name: string, now: Date) {
	await repo.insertFitting({
		batteryAssetTag: f.battery,
		fittedFrom: f.fittedFrom,
		bikeAssetTag: f.bike,
		recordedBy: name,
		recordedAt: toMinute(now),
	});
}
