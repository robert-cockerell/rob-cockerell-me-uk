// Types for the LibreBooking stand-in (test equipment, DEC-26, DEC-27, DEC-29).
// Nothing in the planner imports this folder: the planner reaches the stand-in
// only through the LibreBooking client's base URL and the clock module.

export const RESOURCE_STATUSES = ['available', 'unavailable', 'hidden'] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

/** A bookable resource, one per bike (PRD §7.1, DF-01). */
export interface Resource {
	resourceId: number;
	/** The bike's asset tag, for testers. The real resource name is unconfirmed (A-05). */
	name: string;
	status: ResourceStatus;
}

/** A reservation, with the time the bike was checked in (returned), if it has been. */
export interface Reservation {
	referenceNumber: string;
	resourceId: number;
	startsAt: Date;
	endsAt: Date;
	checkedInAt: Date | null;
	/** The fixture set it was loaded from: `main` or `fri-19`. */
	fixtureSet: string;
}

/** The demo clock: a set start, and whether it runs on from there. */
export interface ClockState {
	/** Demo time at the moment it was set. */
	demoAt: Date;
	/** System time at the moment it was set. */
	setAt: Date;
	running: boolean;
}

export const EVENT_ACTIONS = ['check in', 'set resource status'] as const;
export type EventAction = (typeof EVENT_ACTIONS)[number];

/** A change a tester made on the stand-in during a scenario. Cleared on reset. */
export interface StandinEvent {
	/** E-nn when applied from `stand-in-events.csv`, otherwise null. */
	eventRef: string | null;
	action: EventAction;
	resourceId: number;
	reservationRef: string | null;
	value: string;
	/** Demo time when the change was made. */
	demoAt: Date;
	/** System time when the change was made. */
	appliedAt: Date;
}

/** One request to the stand-in's API or clock (NFR-04). Kept across resets. */
export interface RequestLogEntry {
	receivedAt: Date;
	demoAt: Date | null;
	method: string;
	/** Path and query string, as received. */
	path: string;
	status: number;
	userAgent: string | null;
}

export interface StandinStore {
	getClock(): Promise<ClockState>;
	saveClock(state: ClockState): Promise<void>;

	listResources(): Promise<Resource[]>;
	listReservations(): Promise<Reservation[]>;
	/** Replace every resource. Reservations must be replaced first or after, as they refer to resources. */
	replaceStandinData(resources: Resource[], reservations: Reservation[]): Promise<void>;
	replaceReservations(reservations: Reservation[]): Promise<void>;
	/** Returns false if there's no such resource. */
	setResourceStatus(resourceId: number, status: ResourceStatus): Promise<boolean>;
	/** Returns false if there's no such reservation. */
	setCheckIn(referenceNumber: string, at: Date): Promise<boolean>;

	addEvent(event: StandinEvent): Promise<void>;
	listEvents(): Promise<StandinEvent[]>;
	clearEvents(): Promise<void>;

	appendRequest(entry: RequestLogEntry): Promise<void>;
	/** Newest first. */
	listRequests(options: { sinceDemo?: Date; limit: number }): Promise<RequestLogEntry[]>;
	clearRequestLog(): Promise<void>;
}
