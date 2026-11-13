// The demo clock (DEC-26, Stage 1 item 3): set to a date and time, and either
// held there or left running on from it. Pure: system time is passed in.

import type { ClockState } from './types.ts';

/** The demo date and time now. */
export function demoNow(state: ClockState, system: Date): Date {
	if (!state.running) return new Date(state.demoAt.getTime());
	const elapsed = Math.max(0, system.getTime() - state.setAt.getTime());
	return new Date(state.demoAt.getTime() + elapsed);
}

/** A clock set to `demoAt` at system time `system`. */
export function setClock(demoAt: Date, running: boolean, system: Date): ClockState {
	return { demoAt: new Date(demoAt.getTime()), setAt: new Date(system.getTime()), running };
}

/** Hold the clock at its current demo time, or let it run on from there. */
export function setRunning(state: ClockState, running: boolean, system: Date): ClockState {
	return setClock(demoNow(state, system), running, system);
}
