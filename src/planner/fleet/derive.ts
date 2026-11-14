// Derived, never stored: fault status (DEC-14), battery location and a bike's
// current battery (BR-02, DEC-20), quarantine (DEC-09), the last service
// (DEC-38) and history order (AC-05.2). Pure functions.

import type { BatteryLocation, Entry, Fitting } from './types.ts';

/** BR-07: a fault is open while its Cleared date is blank. */
export function isOpenFault(entry: Entry): boolean {
	return entry.entryType === 'fault' && entry.clearedDate === null;
}

/** DI-036: a battery with an open fault is quarantined. */
export function isQuarantined(batteryAssetTag: string, entries: Entry[]): boolean {
	return entries.some((e) => e.batteryAssetTag === batteryAssetTag && isOpenFault(e));
}

/** Later Fitted from wins; then the one recorded later; then the higher fitting ID (NFR-16). */
function later(a: Fitting, b: Fitting): Fitting {
	const byFitted = a.fittedFrom.getTime() - b.fittedFrom.getTime();
	if (byFitted !== 0) return byFitted > 0 ? a : b;
	const byRecorded = a.recordedAt.getTime() - b.recordedAt.getTime();
	if (byRecorded !== 0) return byRecorded > 0 ? a : b;
	return (a.fittingId ?? 0) >= (b.fittingId ?? 0) ? a : b;
}

function latest(fittings: Fitting[]): Fitting | null {
	return fittings.reduce<Fitting | null>((best, f) => (best ? later(best, f) : f), null);
}

export function latestFittingOfBattery(batteryAssetTag: string, fittings: Fitting[]): Fitting | null {
	return latest(fittings.filter((f) => f.batteryAssetTag === batteryAssetTag));
}

/** BR-02 rule 2 alone: the bike this battery is fitted to, ignoring quarantine. */
export function fittedTo(batteryAssetTag: string, fittings: Fitting[]): string | null {
	const mine = latestFittingOfBattery(batteryAssetTag, fittings);
	if (!mine || !mine.bikeAssetTag) return null;
	const bikes = latest(fittings.filter((f) => f.bikeAssetTag === mine.bikeAssetTag));
	// The bike has no later fitting: its latest is this one.
	return bikes === mine ? mine.bikeAssetTag : null;
}

/** BR-02: quarantined, fitted to a bike, or on the shelf. */
export function batteryLocation(batteryAssetTag: string, fittings: Fitting[], entries: Entry[]): BatteryLocation {
	if (isQuarantined(batteryAssetTag, entries)) return { kind: 'quarantined' };
	const bike = fittedTo(batteryAssetTag, fittings);
	return bike ? { kind: 'fitted', bikeAssetTag: bike } : { kind: 'shelf' };
}

/** BR-02: the battery of the bike's latest fitting, if that's also the battery's latest. */
export function currentBattery(bikeAssetTag: string, fittings: Fitting[]): string | null {
	const bikes = latest(fittings.filter((f) => f.bikeAssetTag === bikeAssetTag));
	if (!bikes) return null;
	return latestFittingOfBattery(bikes.batteryAssetTag, fittings) === bikes ? bikes.batteryAssetTag : null;
}

/** AC-05.2: newest first by Entry date, then Entry ID. */
export function historyOrder(entries: Entry[]): Entry[] {
	return [...entries].sort((a, b) => (a.entryDate === b.entryDate ? b.entryId - a.entryId : a.entryDate < b.entryDate ? 1 : -1));
}

/** DEC-38: the latest service check or dealer service. */
export function lastService(entries: Entry[]): Entry | null {
	return historyOrder(entries).find((e) => e.entryType !== 'fault') ?? null;
}
