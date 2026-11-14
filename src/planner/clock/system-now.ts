// The real system clock. Business time comes from the clock module's now()
// (clock.ts, NFR-14), which falls back to this outside demo mode. Called
// directly only by: process 1, to choose which periods to fetch and to stamp
// Retrieved at; and the fixture loader, to stamp Retrieved at (DEC-59).

export function systemNow(): Date {
	return new Date();
}
