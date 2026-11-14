// Gathers process 2's inputs and runs it: now from the clock, D1 to D3 from
// the database, bookings from LibreBooking (read live each time, PRD §7.1).
// If LibreBooking can't be reached, the plan still shows slots and bands
// (PRD §7.3).

import type { Clock } from '../clock/clock.ts';
import type { DayPlanData } from '../db/day-plan-data.ts';
import type { LibreBookingClient } from '../librebooking/client.ts';
import { londonDate, londonInstant, nextStaffedDate } from '../plan/calendar.ts';
import { buildDayPlan } from '../plan/day-plan.ts';
import type { DayPlan, DayPlanInput } from '../plan/types.ts';

const DAY = 24 * 60;

export async function loadDayPlan(deps: {
	clock: Clock;
	data: DayPlanData;
	librebooking: LibreBookingClient | null;
	log?: (message: string) => void;
}): Promise<DayPlan> {
	const now = await deps.clock.now();
	const planDate = londonDate(now);

	// DF-01's window: today and the next staffed day (DEC-17); the stand-in adds
	// earlier reservations still running or not checked in (DEC-24).
	const window = { start: londonInstant(planDate, 0), end: londonInstant(nextStaffedDate(planDate), DAY) };

	const [bikes, openBikeFaults, forecasts, bookings] = await Promise.all([
		deps.data.listBikes(),
		deps.data.listOpenBikeFaults(),
		deps.data.listForecasts(londonInstant(planDate, 0), londonInstant(planDate, DAY)),
		readBookings(deps, window),
	]);

	const input: DayPlanInput = { now, bikes, bookings, forecasts, openBikeFaults };
	return buildDayPlan(input);
}

async function readBookings(
	deps: { librebooking: LibreBookingClient | null; log?: (message: string) => void },
	window: { start: Date; end: Date },
): Promise<DayPlanInput['bookings']> {
	if (!deps.librebooking) {
		deps.log?.('GM_LIBREBOOKING_URL is not set');
		return null;
	}
	try {
		const [resources, reservations] = await Promise.all([
			deps.librebooking.getResources(),
			deps.librebooking.getReservations(window),
		]);
		return { resources, reservations };
	} catch (error) {
		deps.log?.((error as Error).message);
		return null;
	}
}
