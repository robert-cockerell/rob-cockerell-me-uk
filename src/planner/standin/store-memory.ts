// An in-memory store, for unit tests. Not used by the running stand-in: a
// serverless function forgets it between requests.

import type {
	ClockState,
	RequestLogEntry,
	Reservation,
	Resource,
	ResourceStatus,
	StandinEvent,
	StandinStore,
} from './types.ts';

export function createMemoryStore(initialClock: ClockState): StandinStore & { requests: RequestLogEntry[] } {
	let clock = { ...initialClock };
	let resources: Resource[] = [];
	let reservations: Reservation[] = [];
	let events: StandinEvent[] = [];
	const requests: RequestLogEntry[] = [];

	const copyReservation = (r: Reservation): Reservation => ({ ...r });

	return {
		requests,
		async getClock() {
			return { ...clock };
		},
		async saveClock(state) {
			clock = { ...state };
		},
		async listResources() {
			return resources.map((r) => ({ ...r })).sort((a, b) => a.resourceId - b.resourceId);
		},
		async listReservations() {
			return reservations.map(copyReservation);
		},
		async replaceStandinData(newResources, newReservations) {
			const ids = new Set(newResources.map((r) => r.resourceId));
			for (const r of newReservations) {
				if (!ids.has(r.resourceId)) throw new Error(`Reservation ${r.referenceNumber} refers to unknown resource ${r.resourceId}`);
			}
			resources = newResources.map((r) => ({ ...r }));
			reservations = newReservations.map(copyReservation);
		},
		async replaceReservations(newReservations) {
			const ids = new Set(resources.map((r) => r.resourceId));
			for (const r of newReservations) {
				if (!ids.has(r.resourceId)) throw new Error(`Reservation ${r.referenceNumber} refers to unknown resource ${r.resourceId}`);
			}
			reservations = newReservations.map(copyReservation);
		},
		async setResourceStatus(resourceId: number, status: ResourceStatus) {
			const r = resources.find((x) => x.resourceId === resourceId);
			if (!r) return false;
			r.status = status;
			return true;
		},
		async setCheckIn(referenceNumber: string, at: Date) {
			const r = reservations.find((x) => x.referenceNumber === referenceNumber);
			if (!r) return false;
			r.checkedInAt = new Date(at.getTime());
			return true;
		},
		async addEvent(event) {
			events.push({ ...event });
		},
		async listEvents() {
			return events.map((e) => ({ ...e }));
		},
		async clearEvents() {
			events = [];
		},
		async appendRequest(entry) {
			requests.push({ ...entry });
		},
		async listRequests({ sinceDemo, limit }) {
			return requests
				.filter((e) => !sinceDemo || (e.demoAt !== null && e.demoAt >= sinceDemo))
				.slice()
				.reverse()
				.slice(0, limit);
		},
		async clearRequestLog() {
			requests.length = 0;
		},
	};
}
