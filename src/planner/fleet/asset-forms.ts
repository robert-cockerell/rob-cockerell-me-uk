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
