// Process 2 Build day plan: what goes in and what comes out (DF-01, DF-12,
// DF-13, DF-24 in; DF-03 out). Instants are Date (UTC underneath); local
// Europe/London dates are 'YYYY-MM-DD' strings.

export type IndexBand = 'very low' | 'low' | 'moderate' | 'high' | 'very high';
export type ResourceStatus = 'available' | 'unavailable' | 'hidden';

/** DF-13 Bike list. */
export interface PlanBike {
	bikeAssetTag: string;
	librebookingResourceId: number;
}

/** DF-01 LibreBooking resource. */
export interface PlanResource {
	resourceId: number;
	status: ResourceStatus;
}

/** DF-01 Reservation. Includes earlier ones still running or not checked in (DEC-24). */
export interface PlanReservation {
	resourceId: number;
	start: Date;
	end: Date;
	checkedInAt: Date | null;
}

/** DF-12 Half-hour forecast, already limited to the depot's region. */
export interface PlanForecast {
	periodStart: Date;
	indexBand: IndexBand;
}

/** DF-24 Open bike faults. */
export interface OpenBikeFault {
	bikeAssetTag: string;
	entryId: number;
}

export interface DayPlanInput {
	/** Business time, from the clock module (NFR-14). */
	now: Date;
	bikes: PlanBike[];
	/**
	 * DF-01, or null when LibreBooking can't be reached: the plan then has its
	 * slots and bands but no bike states (PRD §7.3).
	 */
	bookings: { resources: PlanResource[]; reservations: PlanReservation[] } | null;
	forecasts: PlanForecast[];
	openBikeFaults: OpenBikeFault[];
}

/** DI-035, BR-01. Labels are in wording.ts. */
export type BikeState = 'out of service' | 'in the workshop' | 'out on loan' | 'overdue';

export interface SlotBikeState {
	bikeAssetTag: string;
	state: BikeState;
	/** Reservation end (DI-030), only when overdue. */
	dueAt: Date | null;
}

export interface DayPlanSlot {
	/** DI-034, local "HH:MM". */
	time: string;
	start: Date;
	end: Date;
	/** DI-005, or null for "No forecast" (BR-10). */
	band: IndexBand | null;
	/** One per bike, in the order of the bike list. Empty when bookings are unavailable. */
	bikes: SlotBikeState[];
}

export interface DayPlanBike {
	bikeAssetTag: string;
	/** DI-041, BR-03: null is "No booking". */
	nextBooking: Date | null;
	/** DI-042, BR-04. */
	openFault: boolean;
	/** DI-043, BR-05: the start of the later reservation today, or null. */
	bookedAgainAt: Date | null;
	/** BR-12: the bike's resource ID matches no LibreBooking resource. */
	resourceMismatch: boolean;
}

export interface DayPlan {
	/** DI-033, local date. */
	planDate: string;
	/** BR-09: the next weekday. */
	nextStaffedDate: string;
	now: Date;
	/** False when LibreBooking couldn't be reached (PRD §7.3). */
	bookingsAvailable: boolean;
	/** 19 slots, 07:00 to 16:00 local (BR-09). */
	slots: DayPlanSlot[];
	/** In the order of the bike list. Empty when bookings are unavailable. */
	bikes: DayPlanBike[];
}
