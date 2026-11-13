// The stand-in's only reading of the system clock. The demo clock is built on
// top of it (clock.ts). Planner code never imports this: it uses its own clock
// module's now() and systemNow() (NFR-14, DEC-59).

export function systemNow(): Date {
	return new Date();
}
