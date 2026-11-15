import { describe, expect, it } from 'vitest';
import { bandChart } from './band-chart.ts';
import { bikeCounts, currentSlot, dayPlanView, firstRemainingSlot, timeline } from './timeline.ts';
import { plan } from './test-support.ts';

describe('DEC-82 "Rest of day" and "All day"', () => {
	it('"Rest of day" unless the address asks for "All day"', () => {
		expect(dayPlanView(null)).toBe('rest');
		expect(dayPlanView('rest')).toBe('rest');
		expect(dayPlanView('all')).toBe('all');
		expect(dayPlanView('anything')).toBe('rest');
	});

	it('starts at the current slot; before 07:00 at 07:00; after 16:30 nothing is left', () => {
		const p = plan({ now: '2026-06-16 12:10' });
		expect(currentSlot(p)).toBe(10);
		expect(firstRemainingSlot(p)).toBe(10);
		expect(firstRemainingSlot(plan({ now: '2026-06-16 06:45' }))).toBe(0);
		expect(firstRemainingSlot(plan({ now: '2026-06-16 16:29' }))).toBe(18);
		const closed = plan({ now: '2026-06-16 16:30' });
		expect(firstRemainingSlot(closed)).toBe(closed.slots.length);
		expect(timeline(closed, firstRemainingSlot(closed))).toEqual([]);
	});

	it('the first slot shown lists every bike with its state then; later slots only changes', () => {
		const p = plan({ now: '2026-06-16 12:10' });
		const rest = timeline(p, 10);
		expect(rest.map((s) => s.time)).toEqual(['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']);
		expect(rest[0].bikes).toHaveLength(18);
		expect(rest[0].bikes).toEqual(p.slots[10].bikes);
		// From 12:30 on, the lists are the same as in "All day".
		const all = timeline(p);
		expect(rest.slice(1)).toEqual(all.slice(11));
		expect(all.map((s) => s.index)).toEqual([...Array(19).keys()]);
	});

	it('the chart draws the same slots, with the day\'s heights', () => {
		const p = plan({ now: '2026-06-16 12:10' });
		const all = bandChart(p);
		const rest = bandChart(p, 10);
		expect(rest.bars.map((b) => b.time)).toEqual(all.bars.slice(10).map((b) => b.time));
		expect(rest.bars.map((b) => b.height)).toEqual(all.bars.slice(10).map((b) => b.height));
		expect(rest.bars[0].now).toBe(true);
		expect(rest.description).toBe('12:00 to 13:30 very low, 14:00 to 15:30 low, 16:00 moderate');
		expect(bandChart(p, 19).bars).toEqual([]);
	});
});

describe('DEC-80 band chart hours', () => {
	it('each whole hour is numbered under its bar; the half hours aren\'t', () => {
		const chart = bandChart(plan({ now: '2026-06-16 07:00' }));
		expect(chart.bars.map((b) => b.hour).filter((h) => h !== null)).toEqual(['07', '08', '09', '10', '11', '12', '13', '14', '15', '16']);
		expect(chart.bars[1]).toMatchObject({ time: '07:30', hour: null });
	});
});

describe('DEC-81 Bikes in and Bikes out', () => {
	it('at 07:00 on the sample day: 16 in (15 in the workshop, G05 out of service), 2 out (M08 overdue, G04 out on loan)', () => {
		expect(bikeCounts(plan({ now: '2026-06-16 07:00' }))).toEqual({ slot: '07:00', in: 16, out: 2 });
	});

	it('counts the current slot, and every bike is either in or out', () => {
		const p = plan({ now: '2026-06-16 09:10' });
		const counts = bikeCounts(p)!;
		expect(counts.slot).toBe('09:00');
		expect(counts.in + counts.out).toBe(18);
		const out = p.slots[4].bikes.filter((b) => b.state === 'out on loan' || b.state === 'overdue').length;
		expect(counts.out).toBe(out);
	});

	it('before opening it counts 07:00; after closing, 16:00', () => {
		expect(bikeCounts(plan({ now: '2026-06-16 06:30' }))?.slot).toBe('07:00');
		expect(bikeCounts(plan({ now: '2026-06-16 17:00' }))?.slot).toBe('16:00');
	});
});
