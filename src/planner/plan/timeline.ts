// The phone timeline's lists (REQ-04, AC-04.2, DEC-40): the first slot lists
// every bike with its starting state; each later slot lists only the bikes
// whose state differs from the slot before.

import type { DayPlan, IndexBand, SlotBikeState } from './types.ts';

export interface TimelineSlot {
	time: string;
	band: IndexBand | null;
	/** Every bike in the first slot; only changes after that. */
	bikes: SlotBikeState[];
}

const same = (a: SlotBikeState, b: SlotBikeState) =>
	a.state === b.state && (a.dueAt?.getTime() ?? null) === (b.dueAt?.getTime() ?? null);

export function timeline(plan: DayPlan): TimelineSlot[] {
	return plan.slots.map((slot, i) => ({
		time: slot.time,
		band: slot.band,
		bikes: i === 0 ? slot.bikes : slot.bikes.filter((bike, j) => !same(bike, plan.slots[i - 1].bikes[j])),
	}));
}
