// The phone timeline's lists (REQ-04, AC-04.2, DEC-40): the first slot shown
// lists every bike with its state; each later slot lists only the bikes whose
// state differs from the slot before. DEC-82: "Rest of day" starts at the
// current slot, which then lists every bike, as 07:00 does in "All day".

import type { DayPlan, IndexBand, SlotBikeState } from './types.ts';

export interface TimelineSlot {
	/** Index into plan.slots. */
	index: number;
	time: string;
	band: IndexBand | null;
	/** Every bike in the first slot shown; only changes after that. */
	bikes: SlotBikeState[];
}

const same = (a: SlotBikeState, b: SlotBikeState) =>
	a.state === b.state && (a.dueAt?.getTime() ?? null) === (b.dueAt?.getTime() ?? null);

/** The slots from `from` (an index into plan.slots) to the end of the day. */
export function timeline(plan: DayPlan, from = 0): TimelineSlot[] {
	return plan.slots.slice(from).map((slot, k) => {
		const i = from + k;
		return {
			index: i,
			time: slot.time,
			band: slot.band,
			bikes: k === 0 ? slot.bikes : slot.bikes.filter((bike, j) => !same(bike, plan.slots[i - 1].bikes[j])),
		};
	});
}

/** The current slot's index, or -1 when now is outside the staffed day. */
export function currentSlot(plan: DayPlan): number {
	const now = plan.now.getTime();
	return plan.slots.findIndex((s) => s.start.getTime() <= now && now < s.end.getTime());
}

/**
 * DEC-82: where "Rest of day" starts. The current slot; 0 before the first
 * slot starts; plan.slots.length (nothing left) once the last slot has ended.
 */
export function firstRemainingSlot(plan: DayPlan): number {
	const current = currentSlot(plan);
	if (current !== -1) return current;
	const now = plan.now.getTime();
	if (plan.slots.length === 0 || now < plan.slots[0].start.getTime()) return 0;
	return plan.slots.length;
}

export type DayPlanView = 'rest' | 'all';
/** DEC-82: the view in the address (?view=all); "Rest of day" otherwise. */
export const dayPlanView = (param: string | null): DayPlanView => (param === 'all' ? 'all' : 'rest');

/**
 * DEC-81: how many bikes are in and out now. In: "In the workshop" or "Out of
 * service" (at the depot). Out: "Out on loan" or "Overdue – not checked in".
 * Read from the current slot; before opening, 07:00; after closing, 16:00.
 */
export function bikeCounts(plan: DayPlan): { slot: string; in: number; out: number } | null {
	if (plan.slots.length === 0) return null;
	const current = currentSlot(plan);
	const index = current !== -1 ? current : plan.now.getTime() < plan.slots[0].start.getTime() ? 0 : plan.slots.length - 1;
	const bikes = plan.slots[index].bikes;
	const out = bikes.filter((b) => b.state === 'out on loan' || b.state === 'overdue').length;
	return { slot: plan.slots[index].time, in: bikes.length - out, out };
}
