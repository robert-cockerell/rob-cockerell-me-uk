import { describe, expect, it } from 'vitest';
import { batteryLocation, currentBattery, fittedTo, historyOrder, isOpenFault, lastService } from './derive.ts';
import type { Entry, Fitting } from './types.ts';

const t = (local: string) => new Date(`${local}:00+01:00`);
const fit = (battery: string, from: string, bike: string | null, recorded = from): Fitting => ({
	batteryAssetTag: battery,
	fittedFrom: t(from),
	bikeAssetTag: bike,
	recordedBy: 'Dave Morgan',
	recordedAt: t(recorded),
});
const entry = (id: number, type: Entry['entryType'], date: string, asset: { bike?: string; battery?: string }, cleared: string | null = null): Entry => ({
	entryId: id,
	entryType: type,
	entryDate: date,
	bikeAssetTag: asset.bike ?? null,
	batteryAssetTag: asset.battery ?? null,
	description: 'x',
	recordedBy: 'Sam Patel',
	recordedAt: t(`${date} 10:00`),
	clearedDate: cleared,
	clearedBy: cleared ? 'Sam Patel' : null,
});

// Appendix A starting fittings, as fittings.csv.
const base: Fitting[] = [
	fit('B-01', '2026-06-01 09:00', 'M01'),
	fit('B-05', '2026-06-01 09:00', 'M05'),
	fit('B-06', '2026-06-01 09:00', 'M06'),
	fit('B-09', '2026-06-01 09:00', 'M04'),
	fit('B-14', '2026-06-01 09:00', 'G01'),
];
const b09Fault = entry(1044, 'fault', '2026-06-12', { battery: 'B-09' });

describe('BR-02 battery location and current battery', () => {
	it('AC-07.1 B-17 swapped into G01: G01 has B-17, B-14 is on the shelf', () => {
		const after = [...base, fit('B-17', '2026-06-16 08:05', 'G01')];
		expect(currentBattery('G01', after)).toBe('B-17');
		expect(batteryLocation('B-14', after, [])).toEqual({ kind: 'shelf' });
		expect(batteryLocation('B-17', after, [])).toEqual({ kind: 'fitted', bikeAssetTag: 'G01' });
	});

	it('AC-07.4 B-05 moved from M05 to M06: M06 has B-05, M05 has none, B-06 on the shelf', () => {
		const after = [...base, fit('B-05', '2026-06-16 10:45', 'M06')];
		expect(currentBattery('M06', after)).toBe('B-05');
		expect(currentBattery('M05', after)).toBeNull();
		expect(batteryLocation('B-06', after, [])).toEqual({ kind: 'shelf' });
	});

	it('AC-08.1 and AC-08.3 B-09 with an open fault reads Quarantined, fitted or removed', () => {
		expect(batteryLocation('B-09', base, [b09Fault])).toEqual({ kind: 'quarantined' });
		expect(fittedTo('B-09', base)).toBe('M04');
		const removed = [...base, fit('B-09', '2026-06-16 16:25', null)];
		expect(batteryLocation('B-09', removed, [b09Fault])).toEqual({ kind: 'quarantined' });
		expect(currentBattery('M04', removed)).toBeNull();
	});

	it('AC-08.2 B-01 removed from M01: B-01 on the shelf, M01 has none', () => {
		const removed = [...base, fit('B-01', '2026-06-16 08:00', null)];
		expect(batteryLocation('B-01', removed, [])).toEqual({ kind: 'shelf' });
		expect(currentBattery('M01', removed)).toBeNull();
	});

	it('AC-08.4 a battery never fitted is on the shelf', () => {
		expect(batteryLocation('B-28', base, [])).toEqual({ kind: 'shelf' });
	});

	it('AC-11.5 once the fault is cleared, B-09 is fitted again', () => {
		const cleared = { ...b09Fault, clearedDate: '2026-06-16', clearedBy: 'Sam Patel' };
		expect(batteryLocation('B-09', base, [cleared])).toEqual({ kind: 'fitted', bikeAssetTag: 'M04' });
	});

	it('S4.05 DEC-06 the same battery fitted twice in one minute: the later fitting wins', () => {
		const first = { ...fit('B-17', '2026-06-16 08:05', 'G01'), fittingId: 37 };
		const second = { ...fit('B-17', '2026-06-16 08:05', 'M04'), fittingId: 38 };
		const both = [...base, first, second];
		expect(batteryLocation('B-17', both, [])).toEqual({ kind: 'fitted', bikeAssetTag: 'M04' });
		expect(currentBattery('G01', both)).toBeNull();
		expect(currentBattery('M04', both)).toBe('B-17');
	});

	it('NFR-16 two swaps on one bike within a minute: both kept, the bike shows the later', () => {
		const both = [...base, fit('B-17', '2026-06-16 08:05', 'G01'), fit('B-19', '2026-06-16 08:05', 'G01', '2026-06-16 08:06')];
		expect(currentBattery('G01', both)).toBe('B-19');
		expect(batteryLocation('B-17', both, [])).toEqual({ kind: 'shelf' });
	});
});

describe('history and the last service', () => {
	const m07 = [
		entry(1031, 'dealer service', '2026-04-21', { bike: 'M07' }),
		entry(1039, 'fault', '2026-06-11', { bike: 'M07' }, '2026-06-11'),
		entry(1040, 'service check', '2026-06-11', { bike: 'M07' }),
		entry(1043, 'fault', '2026-06-09', { bike: 'M07' }),
	];

	it('AC-05.2 newest first by Entry date, then Entry ID: 1040, 1039, 1043, 1031', () => {
		expect(historyOrder(m07).map((e) => e.entryId)).toEqual([1040, 1039, 1043, 1031]);
	});

	it('AC-05.1 the last service is the 11 June service check (DEC-38)', () => {
		expect(lastService(m07)?.entryId).toBe(1040);
	});

	it('AC-05.4 BR-07 a fault is open until it has a Cleared date', () => {
		expect(m07.filter(isOpenFault).map((e) => e.entryId)).toEqual([1043]);
	});
});
