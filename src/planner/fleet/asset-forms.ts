// Process 3.1 Maintain assets: add and edit bikes, batteries and battery types
// (REQ-06). No status field, no delete (AC-06.5). Every save stamps Last
// updated by and Last updated at from the clock (BR-11, NFR-14).

import { checkBattery, checkBatteryType, checkBike, type BatteryFields, type BikeFields, type Values } from '../forms/validate.ts';
import { routes } from '../ui/routes.ts';
import type { FleetRepo } from './repo.ts';
import type { Battery, BatteryType, Bike } from './types.ts';
import { SAVED } from './wording.ts';

/** Stamps are to the minute (DI-037, DI-039). */
export const toMinute = (d: Date) => new Date(Math.floor(d.getTime() / 60_000) * 60_000);

export const BIKE_FIELDS = ['bikeAssetTag', 'librebookingResourceId', 'make', 'model', 'frameSize', 'bikeSerialNumber', 'bikePurchaseDate'];
export const BATTERY_FIELDS = ['batteryAssetTag', 'batteryType', 'boschSerial', 'batteryPurchaseDate', 'cycleCount'];
export const BATTERY_TYPE_FIELDS = ['batteryType', 'capacity'];

const s = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v));

/**
 * REQ-18: the next number after the highest in use for a tag's prefix
 * (AC-18.2, invented rule), two digits. "B-" for batteries; a family letter
 * for bikes. Null when the family is full (99).
 */
export function nextFreeTag(tags: string[], prefix: string): string | null {
	const used = tags.filter((t) => t.startsWith(prefix)).map((t) => Number(t.slice(prefix.length))).filter(Number.isInteger);
	const next = (used.length ? Math.max(...used) : 0) + 1;
	return next > 99 ? null : `${prefix}${String(next).padStart(2, '0')}`;
}

/** DI-007's bike families. */
const FAMILY: Record<string, string> = { M: 'a Motus', G: 'a GSD', D: 'a donated bike' };

/** REQ-18 for bikes: the next free tag in each family in use, for the tag field's hint. */
export function bikeTagHint(tags: string[]): string {
	const families = [...new Set(tags.map((t) => t[0]))].sort((a, b) => (a === 'M' ? -1 : b === 'M' ? 1 : a.localeCompare(b)));
	const suggestions = families
		.map((f) => ({ tag: nextFreeTag(tags, f), family: FAMILY[f] }))
		.filter((x): x is { tag: string; family: string | undefined } => x.tag !== null)
		.map((x) => (x.family ? `${x.tag} for ${x.family}` : x.tag));
	return suggestions.length ? `Next free: ${suggestions.join(', ')}` : 'For example, M13 or G07';
}

export const bikeValues = (b: Bike): Values => ({
	bikeAssetTag: b.bikeAssetTag,
	librebookingResourceId: s(b.librebookingResourceId),
	make: b.make,
	model: b.model,
	frameSize: s(b.frameSize),
	bikeSerialNumber: s(b.bikeSerialNumber),
	bikePurchaseDate: s(b.bikePurchaseDate),
});
export const batteryValues = (b: Battery): Values => ({
	batteryAssetTag: b.batteryAssetTag,
	batteryType: b.batteryType,
	boschSerial: s(b.boschSerial),
	batteryPurchaseDate: s(b.batteryPurchaseDate),
	cycleCount: s(b.cycleCount),
});
export const batteryTypeValues = (t: BatteryType): Values => ({ batteryType: t.batteryType, capacity: s(t.capacity) });

/** The save steps for a bike; `editing` is the tag being edited, or null to add. */
export async function bikeSave(repo: FleetRepo, values: Values, editing: string | null, now: Date) {
	const bikes = await repo.listBikes();
	const others = bikes.filter((b) => b.bikeAssetTag !== editing);
	return {
		check: () =>
			checkBike(editing ? { ...values, bikeAssetTag: editing } : values, {
				now,
				tagInUse: (tag: string) => !editing && bikes.some((b) => b.bikeAssetTag === tag),
				resourceIdUsedBy: (id: number) => others.find((b) => b.librebookingResourceId === id)?.bikeAssetTag ?? null,
				serialUsedBy: (serial: string) => others.find((b) => b.bikeSerialNumber === serial)?.bikeAssetTag ?? null,
			}),
		write: async (v: BikeFields, name: string) => {
			const fields = { ...v, lastUpdatedBy: name, lastUpdatedAt: toMinute(now) };
			if (editing) await repo.updateBike(editing, fields);
			else await repo.insertBike(fields);
		},
		saved: (v: { bikeAssetTag: string }) => (editing ? SAVED.bikeSaved(editing) : SAVED.bikeAdded(v.bikeAssetTag)),
		redirectTo: (v: { bikeAssetTag: string }) => routes.bike(editing ?? v.bikeAssetTag),
	};
}

export async function batterySave(repo: FleetRepo, values: Values, editing: string | null, now: Date) {
	const [batteries, types] = await Promise.all([repo.listBatteries(), repo.listBatteryTypes()]);
	const others = batteries.filter((b) => b.batteryAssetTag !== editing);
	return {
		check: () =>
			checkBattery(editing ? { ...values, batteryAssetTag: editing } : values, {
				now,
				tagInUse: (tag: string) => !editing && batteries.some((b) => b.batteryAssetTag === tag),
				typeExists: (name: string) => types.some((t) => t.batteryType === name),
				serialUsedBy: (serial: string) => others.find((b) => b.boschSerial === serial)?.batteryAssetTag ?? null,
			}),
		write: async (v: BatteryFields, name: string) => {
			const fields = { ...v, lastUpdatedBy: name, lastUpdatedAt: toMinute(now) };
			if (editing) await repo.updateBattery(editing, fields);
			else await repo.insertBattery(fields);
		},
		saved: (v: { batteryAssetTag: string }) => (editing ? SAVED.batterySaved(editing) : SAVED.batteryAdded(v.batteryAssetTag)),
		redirectTo: (v: { batteryAssetTag: string }) => routes.battery(editing ?? v.batteryAssetTag),
	};
}

export async function batteryTypeSave(repo: FleetRepo, values: Values, editing: string | null) {
	const types = await repo.listBatteryTypes();
	return {
		check: () =>
			checkBatteryType(values, { nameInUse: (name: string) => name !== editing && types.some((t) => t.batteryType === name) }),
		// Battery types carry no change stamp (BR-11); the name is still asked for, as on every save.
		write: async (v: BatteryType) => {
			if (editing) await repo.updateBatteryType(editing, v);
			else await repo.insertBatteryType(v);
		},
		saved: (v: BatteryType) => (editing ? SAVED.typeSaved(v.batteryType) : SAVED.typeAdded(v.batteryType)),
		redirectTo: (v: BatteryType) => routes.batteryType(v.batteryType),
	};
}
