import { describe, expect, it } from 'vitest';
import { createClock, demoClockUrl } from '../clock/clock.ts';
import { createLibreBookingClient, LibreBookingError } from './client.ts';

const BASE = 'http://localhost:4321/demos/charging-planner/stand-in/api';

function stubFetch(routes: Record<string, unknown>, calls: { url: string; method: string }[] = []) {
	return async (input: string, init?: RequestInit) => {
		calls.push({ url: input, method: init?.method ?? 'GET' });
		const key = Object.keys(routes).find((path) => input.includes(path));
		if (!key) return new Response('not found', { status: 404 });
		return new Response(JSON.stringify(routes[key]), { status: 200, headers: { 'Content-Type': 'application/json' } });
	};
}

describe('LibreBooking client (NFR-04 read only)', () => {
	it('has only read methods', () => {
		const client = createLibreBookingClient({ baseUrl: BASE, fetch: stubFetch({}) });
		expect(Object.keys(client).sort()).toEqual(['getReservations', 'getResources']);
	});

	it('maps statusId 0, 1 and 2 to hidden, available and unavailable', async () => {
		const client = createLibreBookingClient({
			baseUrl: `${BASE}/`,
			fetch: stubFetch({
				'Resources/': {
					resources: [
						{ resourceId: 117, name: 'G05', statusId: 0 },
						{ resourceId: 101, name: 'M01', statusId: 1 },
						{ resourceId: 114, name: 'G02', statusId: 2 },
					],
				},
			}),
		});
		expect(await client.getResources()).toEqual([
			{ resourceId: 117, status: 'hidden' },
			{ resourceId: 101, status: 'available' },
			{ resourceId: 114, status: 'unavailable' },
		]);
	});

	it('reads reservations as instants and sends only GET with the window', async () => {
		const calls: { url: string; method: string }[] = [];
		const client = createLibreBookingClient({
			baseUrl: BASE,
			fetch: stubFetch(
				{
					'Reservations/': {
						reservations: [
							{ referenceNumber: 'R-03', resourceId: 102, startDate: '2026-06-16T09:00:00+01:00', endDate: '2026-06-16T11:00:00+01:00', checkInDate: null },
							{ referenceNumber: 'R-08', resourceId: 105, startDate: '2026-06-16T08:00:00+01:00', endDate: '2026-06-16T12:00:00+01:00', checkInDate: '2026-06-16T10:15:00+01:00' },
						],
					},
				},
				calls,
			),
		});
		const reservations = await client.getReservations({
			start: new Date('2026-06-15T23:00:00Z'),
			end: new Date('2026-06-17T23:00:00Z'),
		});
		expect(reservations).toEqual([
			{ resourceId: 102, start: new Date('2026-06-16T08:00:00Z'), end: new Date('2026-06-16T10:00:00Z'), checkedInAt: null },
			{ resourceId: 105, start: new Date('2026-06-16T07:00:00Z'), end: new Date('2026-06-16T11:00:00Z'), checkedInAt: new Date('2026-06-16T09:15:00Z') },
		]);
		expect(calls).toEqual([
			{
				url: `${BASE}/Reservations/?startDateTime=2026-06-15T23%3A00%3A00.000Z&endDateTime=2026-06-17T23%3A00%3A00.000Z`,
				method: 'GET',
			},
		]);
	});

	it('reports an error answer or bad data as LibreBookingError', async () => {
		const down = createLibreBookingClient({ baseUrl: BASE, fetch: async () => new Response('', { status: 503 }) });
		await expect(down.getResources()).rejects.toThrow(LibreBookingError);
		const unreachable = createLibreBookingClient({ baseUrl: BASE, fetch: async () => { throw new Error('ECONNREFUSED'); } });
		await expect(unreachable.getResources()).rejects.toThrow(/can't be reached/);
		const bad = createLibreBookingClient({ baseUrl: BASE, fetch: stubFetch({ 'Resources/': { resources: [{ resourceId: 1, statusId: 7 }] } }) });
		await expect(bad.getResources()).rejects.toThrow(/unknown statusId/);
	});
});

describe('clock (NFR-14)', () => {
	it('finds the demo clock beside the stand-in API', () => {
		expect(demoClockUrl(BASE)).toBe('http://localhost:4321/demos/charging-planner/stand-in/clock');
		expect(demoClockUrl(`${BASE}/`)).toBe('http://localhost:4321/demos/charging-planner/stand-in/clock');
		expect(demoClockUrl('http://localhost:4321/demos/charging-planner/stand-in')).toBeNull();
	});

	it('in demo mode, now() is the demo clock', async () => {
		const clock = createClock({
			demoMode: true,
			librebookingUrl: BASE,
			fetch: stubFetch({ '/stand-in/clock': { now: '2026-06-16T06:00:00.000Z', local: '2026-06-16 07:00' } }),
		});
		expect(await clock.now()).toEqual(new Date('2026-06-16T06:00:00.000Z'));
	});

	it('in demo mode with no demo clock to read, now() fails rather than using the system clock', async () => {
		const clock = createClock({ demoMode: true, librebookingUrl: 'http://localhost:4321/demos/charging-planner/stand-in' });
		await expect(clock.now()).rejects.toThrow(/demo clock can't be found/);
	});

	it('outside demo mode, now() is the system clock', async () => {
		const before = Date.now();
		const now = (await createClock({ demoMode: false }).now()).getTime();
		expect(now).toBeGreaterThanOrEqual(before);
	});
});
