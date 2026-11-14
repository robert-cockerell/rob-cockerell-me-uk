import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nextStaffedDate, slotTimes } from './calendar.ts';
import { at, bikeOf, BIKES, plan, shown, shownFromTo } from './test-support.ts';
import { timeline } from './timeline.ts';
import type { DayPlan } from './types.ts';
import { bandLabel, bookedAgainLabel, nextBookingLabel, RESOURCE_MISMATCH_LABEL, STATE_LABELS } from './wording.ts';

const W = STATE_LABELS['in the workshop'];
const L = STATE_LABELS['out on loan'];
const OUT = STATE_LABELS['out of service'];
const OVERDUE = STATE_LABELS.overdue;

const TIMES = ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

function bands(p: DayPlan): string[] {
	return p.slots.map((s) => bandLabel(s.band));
}
const next = (p: DayPlan, bike: string) => nextBookingLabel(bikeOf(p, bike).nextBooking, p.planDate);

// ---------------------------------------------------------------- S1 at 07:00

describe('S1 The day at 07:00 (CRP script S1 expected day plan)', () => {
	const p = plan({ now: '2026-06-16 07:00' });
	const abbreviate = (label: string) => (label === W ? 'W' : label === L ? 'L' : label);

	// Bike: 07:00 state; changes in later slots; next booking.
	const expected: Record<string, [string, string, string]> = {
		M01: ['W', '09:00 L, 12:00 W, 14:00 L', 'next out: 09:00'],
		M02: ['W', '09:00 L, 11:00 W, 14:00 L, 16:00 W', 'next out: 09:00'],
		M03: ['W', '08:00 L, 10:00 W', 'next out: 08:00'],
		M04: ['W', '14:00 L', 'next out: 14:00'],
		M05: ['W', '08:00 L, 12:00 W', 'next out: 08:00'],
		M06: ['W', '12:00 L, 15:30 W', 'next out: 12:00'],
		M07: ['W', '–', 'next out: Wed 10:00'],
		M08: [`${OVERDUE}, due Mon 16:30`, '–', 'next out: Wed 14:00'],
		M09: ['W', '–', 'No booking'],
		M10: ['W', '07:30 L, 12:30 W', 'next out: 07:30'],
		M11: ['W', '07:30 L, 12:00 W', 'next out: 07:30'],
		M12: ['W', '–', 'No booking'],
		G01: ['W', '08:00 L, 13:00 W', 'next out: 08:00'],
		G02: ['W', '–', 'No booking'],
		G03: ['W', '09:30 L, 15:30 W', 'next out: 09:30'],
		G04: ['L', '–', 'No booking'],
		G05: [OUT, '–', 'No booking'],
		G06: ['W', '10:00 L, 14:00 W', 'next out: 10:00'],
	};

	it.each(Object.entries(expected))('%s matches the S1 table', (bike, [first, changes, nextOut]) => {
		const states = TIMES.map((t) => abbreviate(shown(p, bike, t)));
		const changeList = TIMES.slice(1)
			.map((t, i) => (states[i + 1] !== states[i] ? `${t} ${states[i + 1]}` : null))
			.filter(Boolean)
			.join(', ');
		expect([states[0], changeList || '–', next(p, bike)]).toEqual([first, changes, nextOut]);
	});

	it('AC-04.2 the 07:00 slot lists all 18 bikes; later slots list only changes (S1 change list)', () => {
		const lists = Object.fromEntries(timeline(p).map((s) => [s.time, s.bikes.map((b) => b.bikeAssetTag).join(', ') || 'none']));
		expect(lists['07:00'].split(', ')).toEqual(BIKES.map((b) => b.bikeAssetTag));
		const { ['07:00']: _first, ...later } = lists;
		expect(later).toEqual({
			'07:30': 'M10, M11',
			'08:00': 'M03, M05, G01',
			'08:30': 'none',
			'09:00': 'M01, M02',
			'09:30': 'G03',
			'10:00': 'M03, G06',
			'10:30': 'none',
			'11:00': 'M02',
			'11:30': 'none',
			'12:00': 'M01, M05, M06, M11',
			'12:30': 'M10',
			'13:00': 'G01',
			'13:30': 'none',
			'14:00': 'M01, M02, M04, G06',
			'14:30': 'none',
			'15:00': 'none',
			'15:30': 'M06, G03',
			'16:00': 'M02',
		});
	});

	it('AC-04.3 at 07:00, 12:00 to 13:30 are very low and M11 and M10 come back over lunch', () => {
		expect(p.slots.filter((s) => s.band === 'very low').map((s) => s.time)).toEqual(['12:00', '12:30', '13:00', '13:30']);
		const lunch = timeline(p);
		const m11 = lunch.find((s) => s.time === '12:00')?.bikes.find((b) => b.bikeAssetTag === 'M11');
		const m10 = lunch.find((s) => s.time === '12:30')?.bikes.find((b) => b.bikeAssetTag === 'M10');
		expect(m11?.state).toBe('in the workshop');
		expect(m10?.state).toBe('in the workshop');
	});
});

// ---------------------------------------------------------------- REQ-01

describe('REQ-01 Half-hourly day plan with carbon bands', () => {
	it('AC-01.1 19 slots, 07:00 to 16:00, and no others', () => {
		expect(plan({ now: '2026-06-16 07:00' }).slots.map((s) => s.time)).toEqual(TIMES);
	});

	it('AC-01.2 every slot has its band; 12:00 to 13:30 read very low (Tue 16 June)', () => {
		expect(bands(plan({ now: '2026-06-16 07:00' }))).toEqual([
			...Array(6).fill('moderate'), // 07:00–09:30
			...Array(4).fill('low'), // 10:00–11:30
			...Array(4).fill('very low'), // 12:00–13:30
			...Array(4).fill('low'), // 14:00–15:30
			'moderate', // 16:00
		]);
	});

	it('AC-01.3 with the 15:30 period removed from D1, 15:30 reads "No forecast" and every other slot is unchanged', () => {
		const before = bands(plan({ now: '2026-06-16 07:00' }));
		const after = bands(plan({ now: '2026-06-16 07:00', withoutPeriods: ['2026-06-16T14:30:00Z'] }));
		expect(after[17]).toBe('No forecast');
		expect(after.filter((_, i) => i !== 17)).toEqual(before.filter((_, i) => i !== 17));
	});

	it('AC-01.4 Tue 8 December: every slot shows its band and none is singled out', () => {
		const p = plan({ now: '2026-12-08 07:00' });
		expect(bands(p)).toEqual([
			...Array(4).fill('high'), // 07:00–08:30
			...Array(12).fill('moderate'), // 09:00–14:30
			...Array(3).fill('very high'), // 15:00–16:00
		]);
		// No highlight or "least bad" field; `level` only scales the band chart's bars (DEC-76).
		for (const slot of p.slots) expect(Object.keys(slot).sort()).toEqual(['bikes', 'band', 'end', 'level', 'start', 'time'].sort());
	});

	it('AC-01.5 bands only: the plan carries no gCO₂/kWh figure and no advice', () => {
		const p = plan({ now: '2026-06-16 07:00' });
		const json = JSON.stringify(p);
		expect(json).not.toMatch(/intensity|gCO|least|charge|recommend/i);
	});

	it('DEC-76 each slot\'s level is relative to the day: 0 at the lowest, 1 at the highest; no raw figure in the plan', () => {
		const p = plan({ now: '2026-06-16 07:00' });
		const levels = p.slots.map((s) => s.level as number);
		expect(Math.min(...levels)).toBe(0);
		expect(Math.max(...levels)).toBe(1);
		// Fractions of the day's range, never a gCO₂/kWh figure.
		for (const l of levels) {
			expect(l).toBeGreaterThanOrEqual(0);
			expect(l).toBeLessThanOrEqual(1);
		}
		// The lowest level is in the very low stretch.
		expect(p.slots[levels.indexOf(0)].band).toBe('very low');
	});

	it('DEC-76 a slot with no forecast has no level', () => {
		const p = plan({ now: '2026-06-16 07:00', withoutPeriods: ['2026-06-16T14:30:00Z'] });
		expect(p.slots[17].level).toBeNull();
	});
});

// ---------------------------------------------------------------- BR-08 and BR-09

describe('BR-08 time zones and the clock change; BR-09 staffed days', () => {
	it('S14 Mon 30 March 2026 (BST): 07:00 and 07:30 very low, 08:00 moderate', () => {
		const p = plan({ now: '2026-03-30 09:00', set: 'none' });
		expect(p.slots[0].start.toISOString()).toBe('2026-03-30T06:00:00.000Z');
		expect(bands(p).slice(0, 3)).toEqual(['very low', 'very low', 'moderate']);
		expect(p.slots).toHaveLength(19);
	});

	it('S14 Mon 26 October 2026 (GMT): 07:00 moderate, not very low', () => {
		const p = plan({ now: '2026-10-26 09:00', set: 'none' });
		expect(p.slots[0].start.toISOString()).toBe('2026-10-26T07:00:00.000Z');
		expect(bands(p)[0]).toBe('moderate');
		expect(p.slots).toHaveLength(19);
	});

	it('slots on both clock-change Sundays are local 07:00 to 16:30, 30 minutes each', () => {
		for (const [date, firstUtc] of [['2026-03-29', '2026-03-29T06:00:00.000Z'], ['2026-10-25', '2026-10-25T07:00:00.000Z']]) {
			const slots = slotTimes(date);
			expect(slots).toHaveLength(19);
			expect(slots[0].start.toISOString()).toBe(firstUtc);
			for (const s of slots) expect(s.end.getTime() - s.start.getTime()).toBe(30 * 60_000);
		}
	});

	it('the plan date is the local date of now, also just after midnight BST', () => {
		expect(plan({ now: '2026-06-16 00:30', set: 'none' }).planDate).toBe('2026-06-16');
	});

	it('next staffed day: Tuesday to Wednesday, Friday to Monday (DEC-45)', () => {
		expect(nextStaffedDate('2026-06-16')).toBe('2026-06-17');
		expect(nextStaffedDate('2026-06-19')).toBe('2026-06-22');
	});
});

// ---------------------------------------------------------------- REQ-02 / BR-01, BR-12

describe('REQ-02 Bike state per slot (BR-01)', () => {
	it('AC-02.1 G02 unavailable and G05 hidden read Out of service in every slot, whatever their reservations', () => {
		const p = plan({
			now: '2026-06-16 07:00',
			status: { G02: 'unavailable' },
			extraReservations: [{ bike: 'G02', start: '2026-06-16 09:00', end: '2026-06-16 12:00' }],
		});
		expect(shownFromTo(p, 'G02', '07:00', '16:00')).toEqual([OUT]);
		expect(shownFromTo(p, 'G05', '07:00', '16:00')).toEqual([OUT]);
	});

	it('AC-02.2 now 07:00, M01 reads Out on loan in 09:00 to 11:30', () => {
		const p = plan({ now: '2026-06-16 07:00' });
		expect(shownFromTo(p, 'M01', '09:00', '11:30')).toEqual([L]);
		expect(shown(p, 'M01', '08:30')).toBe(W);
		expect(shown(p, 'M01', '12:00')).toBe(W);
	});

	it('AC-02.3 M02 overdue at 11:30: "due 11:00" in the 11:00 and 11:30 slots (S11.01)', () => {
		const p = plan({ now: '2026-06-16 11:30' });
		expect(shown(p, 'M02', '11:00')).toBe(`${OVERDUE}, due 11:00`);
		expect(shown(p, 'M02', '11:30')).toBe(`${OVERDUE}, due 11:00`);
		expect(shownFromTo(p, 'M02', '11:00', '13:30')).toEqual([`${OVERDUE}, due 11:00`]);
		expect(shownFromTo(p, 'M02', '14:00', '15:30')).toEqual([L]);
	});

	it('AC-02.4 M05 checked in at 10:15: Out on loan 08:00 to 09:30, In the workshop from 10:00 (S13)', () => {
		const p = plan({ now: '2026-06-16 10:30', checkIns: { 'R-08': '2026-06-16 10:15' } });
		expect(shownFromTo(p, 'M05', '08:00', '09:30')).toEqual([L]);
		expect(shownFromTo(p, 'M05', '10:00', '16:00')).toEqual([W]);
	});

	it('AC-02.5 M09, available with no reservation today, reads In the workshop in every slot', () => {
		expect(shownFromTo(plan({ now: '2026-06-16 07:00' }), 'M09', '07:00', '16:00')).toEqual([W]);
	});

	it('AC-02.6 now 07:00, M10 reads In the workshop from 12:30, not overdue (DEC-23)', () => {
		const p = plan({ now: '2026-06-16 07:00' });
		expect(shownFromTo(p, 'M10', '12:30', '16:00')).toEqual([W]);
	});

	it('AC-02.7 M07 reads Out of service once its resource is unavailable (no availability in the tool)', () => {
		expect(shownFromTo(plan({ now: '2026-06-16 09:15' }), 'M07', '07:00', '16:00')).toEqual([W]);
		expect(shownFromTo(plan({ now: '2026-06-16 09:15', status: { M07: 'unavailable' } }), 'M07', '07:00', '16:00')).toEqual([OUT]);
	});

	it('AC-02.8 M12 with a resource ID matching no resource reads Out of service with a mismatch warning (BR-12)', () => {
		const p = plan({ now: '2026-06-16 09:30', resourceIds: { M12: 199 } });
		expect(shownFromTo(p, 'M12', '07:00', '16:00')).toEqual([OUT]);
		expect(bikeOf(p, 'M12').resourceMismatch).toBe(true);
		expect(RESOURCE_MISMATCH_LABEL).toBe("Resource ID doesn't match LibreBooking");
		expect(p.bikes.filter((b) => b.resourceMismatch).map((b) => b.bikeAssetTag)).toEqual(['M12']);
	});

	it('AC-02.9 M08, booked yesterday and never checked in, reads overdue "due Mon 16:30" in every slot', () => {
		expect(shownFromTo(plan({ now: '2026-06-16 07:00' }), 'M08', '07:00', '16:00')).toEqual([`${OVERDUE}, due Mon 16:30`]);
	});

	it('AC-02.10 G04, on loan Mon 09:00 to Wed 16:30, reads Out on loan in every slot', () => {
		expect(shownFromTo(plan({ now: '2026-06-16 07:00' }), 'G04', '07:00', '16:00')).toEqual([L]);
	});

	it('DEC-30 M02 checked in late at 11:45: overdue in the 11:00 slot, In the workshop from 11:30 (S11.08)', () => {
		const p = plan({ now: '2026-06-16 11:45', checkIns: { 'R-03': '2026-06-16 11:45' } });
		expect(shown(p, 'M02', '10:30')).toBe(L);
		expect(shown(p, 'M02', '11:00')).toBe(`${OVERDUE}, due 11:00`);
		expect(shownFromTo(p, 'M02', '11:30', '13:30')).toEqual([W]);
		expect(shownFromTo(p, 'M02', '14:00', '15:30')).toEqual([L]);
	});

	it('BR-01 rule 2: M03 checked in at 10:00 reads In the workshop from the 09:30 slot (S2.02)', () => {
		const p = plan({ now: '2026-06-16 10:00', checkIns: { 'R-05': '2026-06-16 10:00' } });
		expect(shown(p, 'M03', '09:00')).toBe(L);
		expect(shownFromTo(p, 'M03', '09:30', '16:00')).toEqual([W]);
	});

	it('OI-17 an overdue bike whose next reservation has started reads Out on loan for it', () => {
		const p = plan({ now: '2026-06-16 14:30' });
		expect(shown(p, 'M02', '13:30')).toBe(`${OVERDUE}, due 11:00`);
		expect(shown(p, 'M02', '14:00')).toBe(L);
	});

	it('an open fault never changes the state (DEC-02)', () => {
		const withFault = plan({ now: '2026-06-16 07:00' });
		const without = plan({ now: '2026-06-16 07:00', openBikeFaults: [] });
		expect(withFault.slots).toEqual(without.slots);
	});
});

// ---------------------------------------------------------------- REQ-03 / BR-03

describe('REQ-03 Next booking (BR-03)', () => {
	it('AC-03.1 M03, checked in at 10:00, shows "next out: Wed 13:00"', () => {
		expect(next(plan({ now: '2026-06-16 10:00', checkIns: { 'R-05': '2026-06-16 10:00' } }), 'M03')).toBe('next out: Wed 13:00');
	});

	it('AC-03.2 now 10:00, M04 shows "next out: 14:00"', () => {
		expect(next(plan({ now: '2026-06-16 10:00' }), 'M04')).toBe('next out: 14:00');
	});

	it('AC-03.3 now 15:30, M06 checked in at 15:30 shows "next out: Wed 09:00"', () => {
		expect(next(plan({ now: '2026-06-16 15:30', checkIns: { 'R-09': '2026-06-16 15:30' } }), 'M06')).toBe('next out: Wed 09:00');
	});

	it('AC-03.4 M09, booked only on Thu 18 June, shows "No booking"', () => {
		expect(next(plan({ now: '2026-06-16 07:00' }), 'M09')).toBe('No booking');
	});

	it('AC-03.5 now 10:00, M01 shows "next out: 14:00", not the loan that has started', () => {
		expect(next(plan({ now: '2026-06-16 10:00' }), 'M01')).toBe('next out: 14:00');
	});

	it('AC-03.6 Fri 19 June, G03 shows "next out: Mon 09:00"', () => {
		const p = plan({ now: '2026-06-19 09:00', set: 'fri-19' });
		expect(p.planDate).toBe('2026-06-19');
		expect(p.nextStaffedDate).toBe('2026-06-22');
		expect(next(p, 'G03')).toBe('next out: Mon 09:00');
	});

	it('a reservation starting exactly now has started, so it isn\'t the next booking', () => {
		expect(next(plan({ now: '2026-06-16 09:00' }), 'M01')).toBe('next out: 14:00');
	});
});

// ---------------------------------------------------------------- REQ-13 / BR-04

describe('REQ-13 Open fault flag (BR-04)', () => {
	it('AC-13.1 M07 with open fault 1043 is flagged and its state is unchanged', () => {
		const p = plan({ now: '2026-06-16 07:00' });
		expect(bikeOf(p, 'M07').openFault).toBe(true);
		expect(shownFromTo(p, 'M07', '07:00', '16:00')).toEqual([W]);
	});

	it('AC-13.2 once the fault is cleared, the flag has gone', () => {
		expect(bikeOf(plan({ now: '2026-06-16 07:00', openBikeFaults: [] }), 'M07').openFault).toBe(false);
	});

	it('AC-13.3 M04, with quarantined B-09 fitted but no fault of its own, isn\'t flagged', () => {
		const p = plan({ now: '2026-06-16 07:00' });
		expect(bikeOf(p, 'M04').openFault).toBe(false);
		expect(p.bikes.filter((b) => b.openFault).map((b) => b.bikeAssetTag)).toEqual(['M07']);
	});
});

// ---------------------------------------------------------------- REQ-15 / BR-05

describe('REQ-15 Rebooked while overdue (BR-05)', () => {
	it('AC-15.1 now 11:30, overdue M02 is booked again at 14:00', () => {
		const m02 = bikeOf(plan({ now: '2026-06-16 11:30' }), 'M02');
		expect(m02.bookedAgainAt).toEqual(at('2026-06-16 14:00'));
		expect(bookedAgainLabel(m02.bookedAgainAt as Date)).toBe('Booked again at 14:00');
	});

	it('AC-15.2 overdue M08, next booked on the next staffed day, has no warning (S11.05)', () => {
		const p = plan({ now: '2026-06-16 11:30' });
		expect(shown(p, 'M08', '11:30')).toBe(`${OVERDUE}, due Mon 16:30`);
		expect(bikeOf(p, 'M08').bookedAgainAt).toBeNull();
		expect(next(p, 'M08')).toBe('next out: Wed 14:00');
	});

	it('AC-15.3 once M02 is checked in at 11:45, the warning has gone', () => {
		const p = plan({ now: '2026-06-16 11:45', checkIns: { 'R-03': '2026-06-16 11:45' } });
		expect(bikeOf(p, 'M02').bookedAgainAt).toBeNull();
	});

	it('a bike not yet due isn\'t overdue, so has no warning', () => {
		expect(bikeOf(plan({ now: '2026-06-16 10:30' }), 'M02').bookedAgainAt).toBeNull();
	});
});

// ---------------------------------------------------------------- PRD §7.3, purity

describe('process 2 as a pure module', () => {
	it('PRD §7.3 with LibreBooking unreachable, the plan keeps slots and bands but has no bike states', () => {
		const p = plan({ now: '2026-06-16 07:00', bookingsDown: true });
		expect(p.bookingsAvailable).toBe(false);
		expect(p.slots).toHaveLength(19);
		expect(bands(p)[12]).toBe('very low');
		expect(p.slots.every((s) => s.bikes.length === 0)).toBe(true);
		expect(p.bikes).toEqual([]);
	});

	it('gives the same plan for the same inputs', () => {
		expect(plan({ now: '2026-06-16 11:30' })).toEqual(plan({ now: '2026-06-16 11:30' }));
	});

	it('NFR-14 makes no clock, database or network calls', () => {
		const dir = join(process.cwd(), 'src/planner/plan');
		const source = readdirSync(dir)
			.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'test-support.ts')
			.map((f) => readFileSync(join(dir, f), 'utf8'))
			.join('\n');
		expect(source).not.toMatch(/new Date\(\)|Date\.now\(|fetch\(|supabase|systemNow/);
	});
});
