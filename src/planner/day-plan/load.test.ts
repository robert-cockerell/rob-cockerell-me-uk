import { describe, expect, it } from 'vitest';
import { at, BIKES, FORECASTS, scenarioInput } from '../plan/test-support.ts';
import { loadDayPlan } from './load.ts';

const input = scenarioInput({ now: '2026-06-16 07:00' });
const windows: { start: Date; end: Date }[] = [];
const forecastRanges: [Date, Date][] = [];

const data = {
	listBikes: async () => BIKES,
	listOpenBikeFaults: async () => input.openBikeFaults,
	listForecasts: async (from: Date, to: Date) => {
		forecastRanges.push([from, to]);
		return FORECASTS.filter((f) => f.periodStart >= from && f.periodStart < to);
	},
};
const librebooking = {
	getResources: async () => input.bookings?.resources ?? [],
	getReservations: async (window: { start: Date; end: Date }) => {
		windows.push(window);
		return input.bookings?.reservations ?? [];
	},
};
const clock = { now: async () => at('2026-06-16 07:00') };

describe('loadDayPlan', () => {
	it('reads today and the next staffed day from LibreBooking (DEC-17), and today\'s forecasts', async () => {
		const plan = await loadDayPlan({ clock, data, librebooking });
		expect(plan.planDate).toBe('2026-06-16');
		expect(windows[0]).toEqual({ start: at('2026-06-16 00:00'), end: at('2026-06-18 00:00') });
		expect(forecastRanges[0]).toEqual([at('2026-06-16 00:00'), at('2026-06-17 00:00')]);
		expect(plan.slots[12].band).toBe('very low');
		expect(plan.bikes).toHaveLength(18);
	});

	it('PRD §7.3 if LibreBooking fails, the plan has bands but no bike states, and the error is logged', async () => {
		const logged: string[] = [];
		const plan = await loadDayPlan({
			clock,
			data,
			librebooking: { getResources: async () => { throw new Error('LibreBooking answered 503'); }, getReservations: async () => [] },
			log: (m) => logged.push(m),
		});
		expect(plan.bookingsAvailable).toBe(false);
		expect(plan.slots[0].band).toBe('moderate');
		expect(logged).toEqual(['LibreBooking answered 503']);
	});
});
