// Process 3.4 Show asset record: what a bike or battery record shows, worked
// out from D2 and D3 (DF-22, DF-23).

import { batteryLocation, currentBattery, fittedTo, historyOrder, isOpenFault, lastService } from './derive.ts';
import type { FleetRepo } from './repo.ts';
import type { Battery, BatteryLocation, BatteryType, Bike, Entry } from './types.ts';

export interface BikeRecord {
	bike: Bike;
	lastService: Entry | null;
	battery: (Battery & { capacity: number | null }) | null;
	history: Entry[];
	openFaults: Entry[];
}

export async function loadBikeRecord(repo: FleetRepo, tag: string): Promise<BikeRecord | null> {
	const [bike, fittings, entries] = await Promise.all([repo.getBike(tag), repo.listFittings(), repo.listEntries({ bike: tag })]);
	if (!bike) return null;
	const batteryTag = currentBattery(tag, fittings);
	const battery = batteryTag ? await repo.getBattery(batteryTag) : null;
	const type = battery ? await repo.getBatteryType(battery.batteryType) : null;
	return {
		bike,
		lastService: lastService(entries),
		battery: battery ? { ...battery, capacity: type?.capacity ?? null } : null,
		history: historyOrder(entries),
		openFaults: historyOrder(entries.filter(isOpenFault)),
	};
}

export interface BatteryRecord {
	battery: Battery;
	type: BatteryType | null;
	location: BatteryLocation;
	/** The bike it's in, even when quarantined (AC-08.3). */
	fittedTo: string | null;
	history: Entry[];
	openFaults: Entry[];
}

export async function loadBatteryRecord(repo: FleetRepo, tag: string): Promise<BatteryRecord | null> {
	const [battery, fittings, entries] = await Promise.all([repo.getBattery(tag), repo.listFittings(), repo.listEntries({ battery: tag })]);
	if (!battery) return null;
	return {
		battery,
		type: await repo.getBatteryType(battery.batteryType),
		location: batteryLocation(tag, fittings, entries),
		fittedTo: fittedTo(tag, fittings),
		history: historyOrder(entries),
		openFaults: historyOrder(entries.filter(isOpenFault)),
	};
}

/** Every battery with its location (AC-08.5, DEC-43). */
export async function batteryLocations(repo: FleetRepo): Promise<{ battery: Battery; location: BatteryLocation }[]> {
	const [batteries, fittings, openFaults] = await Promise.all([repo.listBatteries(), repo.listFittings(), repo.listOpenFaults()]);
	return batteries.map((battery) => ({ battery, location: batteryLocation(battery.batteryAssetTag, fittings, openFaults) }));
}
