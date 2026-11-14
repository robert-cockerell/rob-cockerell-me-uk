// The real system clock. Business time comes from the clock module's now()
// (NFR-14, built in Stage 4). systemNow() is the one exception, and only for:
// process 1, to choose which periods to fetch and to stamp Retrieved at; and
// the fixture loader, to stamp Retrieved at (DEC-59).

export function systemNow(): Date {
	return new Date();
}
