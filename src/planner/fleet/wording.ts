// Fleet records' words (UI spec §8, data dictionary §2, PRD BR-02). Times and
// dates in UK local time (BR-08).

import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { LONDON } from '../time/london.ts';
import type { BatteryLocation, EntryType } from './types.ts';

/** C17 empty values. */
export const EMPTY = {
	frameSize: 'One size',
	notRecorded: 'Not recorded',
	cycleCount: 'Not yet read',
	noBattery: 'No battery fitted',
};

/** "16 Jun 2026" from 'YYYY-MM-DD'. */
export function dateLabel(date: string): string {
	const [y, m, d] = date.split('-').map(Number);
	return format(new TZDate(y, m - 1, d, 12, 0, LONDON), 'd MMM yyyy');
}

/** "10 Jun 2026 14:03" in UK local time. */
export function stampLabel(at: Date): string {
	return format(new TZDate(at.getTime(), LONDON), 'd MMM yyyy HH:mm');
}

/** For a datetime-local input: "2026-06-16T08:05". */
export function localInputValue(at: Date): string {
	return format(new TZDate(at.getTime(), LONDON), "yyyy-MM-dd'T'HH:mm");
}

/** DI-040: "Fitted to M07", "On the shelf", "Quarantined". */
export function locationLabel(location: BatteryLocation): string {
	if (location.kind === 'quarantined') return 'Quarantined';
	if (location.kind === 'fitted') return `Fitted to ${location.bikeAssetTag}`;
	return 'On the shelf';
}

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
	'service check': 'Service check',
	'dealer service': 'Dealer service',
	fault: 'Fault',
};

/** DI-019 shown with its unit. */
export const capacityLabel = (capacity: number | null) => (capacity === null ? EMPTY.notRecorded : `${capacity} Wh`);

/** C16 save notices: say what changed. */
export const SAVED = {
	bikeAdded: (tag: string) => ({ title: 'Bike added', body: `${tag} is in the bike list.` }),
	bikeSaved: (tag: string) => ({ title: 'Bike saved', body: `${tag}'s details are updated.` }),
	batteryAdded: (tag: string) => ({ title: 'Battery added', body: `${tag} is on the shelf.` }),
	batterySaved: (tag: string) => ({ title: 'Battery saved', body: `${tag}'s details are updated.` }),
	typeAdded: (name: string) => ({ title: 'Battery type added', body: `${name} can now be chosen for a battery.` }),
	typeSaved: (name: string) => ({ title: 'Battery type saved', body: `${name} is updated.` }),
	swap: (bike: string, battery: string, previous: string | null) => ({
		title: 'Swap saved',
		body: `${bike} now has ${battery}.${previous && previous !== battery ? ` ${previous} is on the shelf.` : ''}`,
	}),
	removed: (battery: string, bike: string, quarantined: boolean) => ({
		title: 'Battery removed',
		body: `${bike} has no battery fitted. ${battery} is ${quarantined ? 'quarantined' : 'on the shelf'}.`,
	}),
	fault: (asset: string) => ({ title: 'Fault saved', body: `The fault on ${asset} is open until someone clears it.` }),
	check: (asset: string) => ({ title: 'Service check saved', body: `It's in ${asset}'s history.` }),
	dealer: (asset: string, cleared: number) => ({
		title: 'Dealer service saved',
		body: `It's in ${asset}'s history.${cleared ? ` ${cleared === 1 ? '1 fault is' : `${cleared} faults are`} now closed.` : ''}`,
	}),
	cleared: (asset: string) => ({ title: 'Fault cleared', body: `The fault on ${asset} is closed.` }),
	name: (name: string) => ({ title: 'Name saved', body: `Changes on this device will show ${name}.` }),
};
