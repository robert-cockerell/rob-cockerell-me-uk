// Process 2 Build day plan, as a pure function. No database, network or clock
// calls: everything, "now" included, comes in as arguments. Implements BR-01,
// BR-03, BR-04, BR-05, BR-08, BR-09, BR-10 and BR-12.

import { londonDate, nextStaffedDate, slotTimes } from './calendar.ts';
import type {
	BikeState,
	DayPlan,
	DayPlanBike,
	DayPlanInput,
	PlanReservation,
	ResourceStatus,
	SlotBikeState,
} from './types.ts';

const t = (d: Date) => d.getTime();

interface BikeBookings {
	/** Null when the bike's resource ID matches no resource (BR-12). */
	status: ResourceStatus | null;
	/** Sorted by start. */
	reservations: PlanReservation[];
}

/** "The reservation" for a slot: the latest that started before the slot ends (BR-01, DEC-24). */
function reservationFor(reservations: PlanReservation[], slotEnd: Date): PlanReservation | null {
	let found: PlanReservation | null = null;
	for (const r of reservations) {
		if (t(r.start) < t(slotEnd)) found = r;
		else break;
	}
	return found;
}

/** BR-01: the first rule that matches, for one bike in one slot. */
export function bikeStateInSlot(
	bookings: BikeBookings,
	slotStart: Date,
	slotEnd: Date,
	now: Date,
): { state: BikeState; dueAt: Date | null } {
	// Rule 1, and BR-12 for a bike with no matching resource.
	if (bookings.status !== 'available') return { state: 'out of service', dueAt: null };

	const r = reservationFor(bookings.reservations, slotEnd);
	if (!r) return { state: 'in the workshop', dueAt: null };

	// "Checked in by the slot's end" is judged for each slot (DEC-30).
	const checkedInBySlotEnd = r.checkedInAt !== null && t(r.checkedInAt) <= t(slotEnd);
	const covers = t(r.start) < t(slotEnd) && t(r.end) > t(slotStart);

	// Rule 2: the reservation covers the slot or has ended, and the bike was checked in by the slot's end.
	if (checkedInBySlotEnd) return { state: 'in the workshop', dueAt: null };
	// Rule 3.
	if (covers) return { state: 'out on loan', dueAt: null };
	// Rule 4: only once the due time has passed (DEC-23).
	if (t(r.end) < t(now)) return { state: 'overdue', dueAt: r.end };
	// Rule 5.
	return { state: 'in the workshop', dueAt: null };
}

/** BR-05's "overdue now": BR-01 rule 4 read at the instant now. */
function overdueNow(bookings: BikeBookings, now: Date): boolean {
	if (bookings.status !== 'available') return false;
	let r: PlanReservation | null = null;
	for (const candidate of bookings.reservations) {
		if (t(candidate.start) <= t(now)) r = candidate;
		else break;
	}
	if (!r) return false;
	const checkedIn = r.checkedInAt !== null && t(r.checkedInAt) <= t(now);
	return !checkedIn && t(r.end) < t(now);
}

export function buildDayPlan(input: DayPlanInput): DayPlan {
	const { now } = input;
	const planDate = londonDate(now);
	const nextDate = nextStaffedDate(planDate);

	// BR-10: each slot takes the forecast period that starts at the same instant (BR-08).
	const bandByStart = new Map(input.forecasts.map((f) => [t(f.periodStart), f.indexBand]));
	const times = slotTimes(planDate);

	// DEC-76: each slot's place between the day's lowest and highest forecast.
	const intensityByStart = new Map(
		input.forecasts.filter((f) => typeof f.forecastIntensity === 'number').map((f) => [t(f.periodStart), f.forecastIntensity as number]),
	);
	const dayValues = times.map((s) => intensityByStart.get(t(s.start))).filter((v): v is number => v !== undefined);
	const low = Math.min(...dayValues);
	const high = Math.max(...dayValues);
	const levelAt = (start: Date): number | null => {
		const v = intensityByStart.get(t(start));
		if (v === undefined || !bandByStart.has(t(start))) return null;
		return high === low ? 0.5 : Math.round(((v - low) / (high - low)) * 100) / 100;
	};

	if (!input.bookings) {
		return {
			planDate,
			nextStaffedDate: nextDate,
			now,
			bookingsAvailable: false,
			slots: times.map((s) => ({ ...s, band: bandByStart.get(t(s.start)) ?? null, level: levelAt(s.start), bikes: [] })),
			bikes: [],
		};
	}

	const statusById = new Map(input.bookings.resources.map((r) => [r.resourceId, r.status]));
	const reservationsById = new Map<number, PlanReservation[]>();
	for (const r of input.bookings.reservations) {
		const list = reservationsById.get(r.resourceId) ?? [];
		list.push(r);
		reservationsById.set(r.resourceId, list);
	}
	for (const list of reservationsById.values()) list.sort((a, b) => t(a.start) - t(b.start));

	const faulty = new Set(input.openBikeFaults.map((f) => f.bikeAssetTag));

	const bookingsFor = new Map<string, BikeBookings>(
		input.bikes.map((bike) => [
			bike.bikeAssetTag,
			{
				status: statusById.get(bike.librebookingResourceId) ?? null,
				reservations: reservationsById.get(bike.librebookingResourceId) ?? [],
			},
		]),
	);

	const slots = times.map((s) => ({
		...s,
		band: bandByStart.get(t(s.start)) ?? null,
		level: levelAt(s.start),
		bikes: input.bikes.map((bike): SlotBikeState => ({
			bikeAssetTag: bike.bikeAssetTag,
			...bikeStateInSlot(bookingsFor.get(bike.bikeAssetTag) as BikeBookings, s.start, s.end, now),
		})),
	}));

	const bikes = input.bikes.map((bike): DayPlanBike => {
		const bookings = bookingsFor.get(bike.bikeAssetTag) as BikeBookings;
		const notStarted = bookings.reservations.filter((r) => t(r.start) > t(now));

		// BR-03: the earliest reservation that hasn't started, today or on the next staffed day.
		const next = notStarted.find((r) => {
			const day = londonDate(r.start);
			return day === planDate || day === nextDate;
		});

		// BR-05: overdue now, and another reservation starts later today.
		const laterToday = notStarted.find((r) => londonDate(r.start) === planDate);

		return {
			bikeAssetTag: bike.bikeAssetTag,
			nextBooking: next ? next.start : null,
			openFault: faulty.has(bike.bikeAssetTag),
			bookedAgainAt: laterToday && overdueNow(bookings, now) ? laterToday.start : null,
			resourceMismatch: bookings.status === null,
		};
	});

	return { planDate, nextStaffedDate: nextDate, now, bookingsAvailable: true, slots, bikes };
}
