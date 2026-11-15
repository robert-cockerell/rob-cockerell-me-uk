// Run with: npm run test:standin (Node's own test runner; see README.md).
// Tests are named with the CRP set-up step, reset or requirement they check.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { handleApi, handleClock } from './api.ts';
import { consoleAccess, consoleToken, keyMatches } from './console-access.ts';
import {
	parseClockSettings,
	parseEvents,
	parseForecasts,
	parseReservations,
	parseResources,
	reservationsInSet,
} from './fixtures.ts';
import { selectReservations } from './librebooking.ts';
import {
	addCheckIn,
	applyEvent,
	applyOverride,
	applyReset,
	loadReservationSet,
	setDemoClock,
	setDemoClockRunning,
	unimplementedResetRows,
} from './operations.ts';
import { currentDemoTime } from './operations.ts';
import { fakePlanner, local, realFixtures, testDeps } from './test-support.ts';

const API = 'http://localhost/demos/charging-planner/stand-in/api/';

function get(path: string, method = 'GET'): Request {
	return new Request(API + path, { method, headers: { 'user-agent': 'unit-test' } });
}

async function body<T = any>(response: Response): Promise<T> {
	return (await response.json()) as T;
}

describe('fixture files in test-data/', () => {
	const f = realFixtures();

	it('lb-resources.csv: 19 resources, 101 to 119, G05 hidden, the rest available', () => {
		const resources = parseResources(f.resources);
		assert.equal(resources.length, 19);
		assert.deepEqual(
			resources.map((r) => r.resourceId),
			Array.from({ length: 19 }, (_, i) => 101 + i),
		);
		assert.deepEqual(resources.filter((r) => r.status !== 'available').map((r) => r.name), ['G05']);
	});

	it('lb-reservations.csv: set main has R-01 to R-20, set fri-19 has R-21, all without check-ins', () => {
		const all = parseReservations(f.reservations);
		assert.equal(reservationsInSet(all, 'main').length, 20);
		assert.deepEqual(reservationsInSet(all, 'fri-19').map((r) => r.referenceNumber), ['R-21']);
		assert.equal(reservationsInSet(all, 'none').length, 0);
		assert.ok(all.every((r) => r.checkedInAt === null));
	});

	it('stand-in-events.csv: E-01 to E-08 are all usable', () => {
		assert.deepEqual(
			parseEvents(f.events).map((e) => e.eventId),
			['E-01', 'E-02', 'E-03', 'E-04', 'E-05', 'E-06', 'E-07', 'E-08'],
		);
	});

	it('demo-clock.csv: 21 settings, each uk_offset right for its date', () => {
		assert.equal(parseClockSettings(f.clock).length, 21);
	});

	it('resets-and-overrides.csv: every row has an implementation', () => {
		assert.deepEqual(unimplementedResetRows(f), []);
	});

	it('forecasts.csv is ready for D1: 80 half-hour periods in UTC on the four scenario dates', () => {
		const rows = parseForecasts(f.forecasts);
		// 16 June 19, 8 December 19, 30 March 21, 26 October 21.
		assert.equal(rows.length, 80);
		const dates = new Set(rows.map((r) => r.periodStart.toISOString().slice(0, 10)));
		assert.deepEqual([...dates].sort(), ['2026-03-30', '2026-06-16', '2026-10-26', '2026-12-08']);
		assert.ok(rows.every((r) => r.region === 'South England'));
		// A.5: 16 June 07:00 BST is the 06:00Z period, moderate; 12:00 BST very low.
		const at = (iso: string) => rows.find((r) => r.periodStart.toISOString() === iso);
		assert.equal(at('2026-06-16T06:00:00.000Z')?.indexBand, 'moderate');
		assert.equal(at('2026-06-16T11:00:00.000Z')?.indexBand, 'very low');
		assert.equal(at('2026-06-16T14:30:00.000Z')?.indexBand, 'low');
	});

	it('forecasts.csv: a bad row is refused with its file and row', () => {
		assert.throws(
			() => parseForecasts('region,period_start,forecast_intensity,index_band\nSouth England,2026-06-16T06:15Z,1,low\n'),
			/forecasts\.csv, row 2: period_start/,
		);
		assert.throws(
			() => parseForecasts('region,period_start,forecast_intensity,index_band\nSouth England,2026-06-16T06:00Z,1,green\n'),
			/unknown index band/,
		);
	});
});

describe('which reservations the stand-in returns (DEC-24)', () => {
	const main = reservationsInSet(parseReservations(realFixtures().reservations), 'main');
	const today = { start: local('2026-06-16'), end: local('2026-06-17'), resourceId: null };

	it('S1: 12 bikes have a reservation running on Tue 16 June', () => {
		const running = main.filter((r) => r.startsAt < today.end && r.endsAt > today.start);
		assert.equal(new Set(running.map((r) => r.resourceId)).size, 12);
	});

	it('today and the next staffed day: everything but Thursday, with M08\'s Monday loan', () => {
		const refs = selectReservations(main, { start: local('2026-06-16'), end: local('2026-06-18'), resourceId: null }).map(
			(r) => r.referenceNumber,
		);
		assert.equal(refs.length, 19);
		assert.ok(refs.includes('R-11'), 'M08 overdue from Monday, not checked in');
		assert.ok(refs.includes('R-12'), 'G04 loan running since Monday');
		assert.ok(!refs.includes('R-13'), 'M09 Thursday only');
	});

	it('an earlier reservation checked in before the window is left out', () => {
		const m08 = main.filter((r) => r.referenceNumber === 'R-11').map((r) => ({ ...r, checkedInAt: local('2026-06-15 17:00') }));
		assert.equal(selectReservations(m08, today).length, 0);
	});

	it('an earlier reservation checked in during the window is kept, so slots before the check-in can read overdue (DEC-30)', () => {
		const m08 = main.filter((r) => r.referenceNumber === 'R-11').map((r) => ({ ...r, checkedInAt: local('2026-06-16 10:00') }));
		assert.equal(selectReservations(m08, today).length, 1);
	});

	it('filters by resource', () => {
		const refs = selectReservations(main, { ...today, resourceId: 101 }).map((r) => r.referenceNumber);
		assert.deepEqual(refs, ['R-01', 'R-02']);
	});
});

describe('SU.05 and SU.06: load the baseline and set the clock', () => {
	it('R0 loads the stand-in with no events, empties the request log, and says D1 to D3 are skipped', async () => {
		const { deps, store } = testDeps();
		await handleApi(get('Resources/'), 'Resources/', deps);
		assert.equal(store.requests.length, 1);

		const report = await applyReset(deps, 'R0');
		assert.equal(report.ok, true);
		assert.equal((await store.listResources()).length, 19);
		assert.equal((await store.listReservations()).length, 20);
		assert.equal((await store.listEvents()).length, 0);
		assert.equal(store.requests.length, 0, 'request log starts empty');
		assert.equal(report.skipped.length, 1);
		assert.match(report.skipped[0], /route A/i);
	});

	it('public demo: with logging off, a request is served and nothing is written to the request log', async () => {
		const { deps, store } = testDeps();
		const response = await handleApi(get('Resources/'), 'Resources/', { ...deps, logRequests: false });
		assert.equal(response.status, 200);
		assert.equal(store.requests.length, 0);
	});

	it('SU.06: the clock set to Tue 16 June 2026 07:00 is what the clock endpoint serves', async () => {
		const { deps } = testDeps();
		await setDemoClock(deps, '2026-06-16 07:00', false);
		const response = await handleClock(new Request('http://localhost/demos/charging-planner/stand-in/clock'), deps);
		const json = await body(response);
		assert.equal(json.now, '2026-06-16T06:00:00.000Z');
		assert.equal(json.local, '2026-06-16 07:00');
		assert.equal(json.offsetTime, '2026-06-16T07:00:00+01:00');
		assert.equal(json.timeZone, 'Europe/London');
	});
});

describe('demo clock', () => {
	it('held: stays where it was set', async () => {
		const { deps, advance } = testDeps();
		await setDemoClock(deps, '2026-06-16 08:05', false);
		advance(10 * 60_000);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-16 08:05').toISOString());
	});

	it('running: runs on from the set start', async () => {
		const { deps, advance } = testDeps();
		await setDemoClock(deps, '2026-06-16 08:05', true);
		advance(3 * 60_000);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-16 08:08').toISOString());
		await setDemoClockRunning(deps, false);
		advance(60 * 60_000);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-16 08:08').toISOString());
	});

	it('refuses a time that is not real', async () => {
		const { deps } = testDeps();
		const report = await setDemoClock(deps, '2026-06-31 08:00', false);
		assert.equal(report.ok, false);
	});
});

describe('stand-in API', () => {
	it('Resources/: every resource with LibreBooking status IDs (hidden 0, available 1, unavailable 2)', async () => {
		const { deps } = testDeps();
		await applyReset(deps, 'R0');
		const json = await body(await handleApi(get('Resources/'), 'Resources/', deps));
		assert.equal(json.resources.length, 19);
		assert.deepEqual(json.resources[0], { resourceId: 101, name: 'M01', statusId: 1 });
		assert.equal(json.resources.find((r: any) => r.name === 'G05').statusId, 0);
	});

	it('Reservations/: window from the query, times with the London offset, check-in null', async () => {
		const { deps } = testDeps();
		await applyReset(deps, 'R0');
		const response = await handleApi(
			get('Reservations/?startDateTime=2026-06-16T00:00:00%2B01:00&endDateTime=2026-06-18T00:00:00%2B01:00'),
			'Reservations/',
			deps,
		);
		assert.equal(response.status, 200);
		const json = await body(response);
		assert.equal(json.reservations.length, 19);
		const m01 = json.reservations.find((r: any) => r.referenceNumber === 'R-01');
		assert.deepEqual(m01, {
			referenceNumber: 'R-01',
			resourceId: 101,
			resourceName: 'M01',
			startDate: '2026-06-16T09:00:00+01:00',
			endDate: '2026-06-16T12:00:00+01:00',
			checkInDate: null,
			checkOutDate: null,
		});
		assert.equal(json.startDateTime, '2026-06-16T00:00:00+01:00');
	});

	it('Reservations/: with no dates, from the start of the demo day for two weeks', async () => {
		const { deps } = testDeps();
		await applyReset(deps, 'R0');
		const json = await body(await handleApi(get('Reservations/'), 'Reservations/', deps));
		assert.equal(json.startDateTime, '2026-06-16T00:00:00+01:00');
		assert.equal(json.endDateTime, '2026-06-30T00:00:00+01:00');
		assert.equal(json.reservations.length, 20);
	});

	it('Reservations/: a bad date is refused with 400', async () => {
		const { deps } = testDeps();
		const response = await handleApi(get('Reservations/?startDateTime=soon'), 'Reservations/', deps);
		assert.equal(response.status, 400);
	});

	it('NFR-04: anything but GET or HEAD is refused with 405 and changes nothing', async () => {
		const { deps, store } = testDeps();
		await applyReset(deps, 'R0');
		for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
			const response = await handleApi(get('Reservations/', method), 'Reservations/', deps);
			assert.equal(response.status, 405);
			assert.equal(response.headers.get('Allow'), 'GET, HEAD');
		}
		assert.equal((await store.listReservations()).length, 20);
	});

	it('NFR-04: every request is logged with method, path, system time and demo time', async () => {
		const { deps, store } = testDeps();
		await applyReset(deps, 'R0');
		await setDemoClock(deps, '2026-06-16 08:05', false);
		await handleApi(get('Reservations/?resourceId=113'), 'Reservations/', deps);
		await handleApi(get('Reservations/', 'POST'), 'Reservations/', deps);
		await handleApi(get('Nothing'), 'Nothing', deps);
		await handleClock(
			new Request('http://localhost/demos/charging-planner/stand-in/clock', { headers: { 'user-agent': 'unit-test' } }),
			deps,
		);
		const log = await store.listRequests({ limit: 10 });
		assert.deepEqual(
			log.map((e) => [e.method, e.path, e.status]).reverse(),
			[
				['GET', '/demos/charging-planner/stand-in/api/Reservations/?resourceId=113', 200],
				['POST', '/demos/charging-planner/stand-in/api/Reservations/', 405],
				['GET', '/demos/charging-planner/stand-in/api/Nothing', 404],
				['GET', '/demos/charging-planner/stand-in/clock', 200],
			],
		);
		assert.ok(log.every((e) => e.demoAt?.toISOString() === local('2026-06-16 08:05').toISOString()));
		assert.ok(log.every((e) => e.receivedAt instanceof Date && e.userAgent === 'unit-test'));
	});

	it('S4.04: the log can be read since a demo time', async () => {
		const { deps, store } = testDeps();
		await applyReset(deps, 'R0');
		await setDemoClock(deps, '2026-06-16 08:00', false);
		await handleApi(get('Resources/'), 'Resources/', deps);
		await setDemoClock(deps, '2026-06-16 08:05', false);
		await handleApi(get('Reservations/'), 'Reservations/', deps);
		const since = await store.listRequests({ sinceDemo: local('2026-06-16 08:05'), limit: 10 });
		assert.deepEqual(since.map((e) => e.path), ['/demos/charging-planner/stand-in/api/Reservations/']);
	});

	it('HEAD answers without a body', async () => {
		const { deps } = testDeps();
		await applyReset(deps, 'R0');
		const response = await handleApi(get('Resources/', 'HEAD'), 'Resources/', deps);
		assert.equal(response.status, 200);
		assert.equal(await response.text(), '');
	});
});

describe('tester changes during scenarios', () => {
	it('S2.01 (E-01): M03 checked in at 10:00 shows on its reservation', async () => {
		const { deps, store } = testDeps();
		await applyReset(deps, 'R0');
		await setDemoClock(deps, '2026-06-16 10:00', false);
		const report = await applyEvent(deps, 'E-01');
		assert.equal(report.ok, true);
		const r05 = (await store.listReservations()).find((r) => r.referenceNumber === 'R-05');
		assert.equal(r05?.checkedInAt?.toISOString(), local('2026-06-16 10:00').toISOString());
		const json = await body(await handleApi(get('Reservations/?resourceId=103'), 'Reservations/', deps));
		assert.equal(json.reservations[0].checkInDate, '2026-06-16T10:00:00+01:00');
	});

	it('S5.07 (E-04): G02 set unavailable; E-05 and E-06 take M07 out and back', async () => {
		const { deps, store } = testDeps();
		await applyReset(deps, 'R0');
		await applyEvent(deps, 'E-04');
		await applyEvent(deps, 'E-05');
		const statuses = new Map((await store.listResources()).map((r) => [r.name, r.status]));
		assert.equal(statuses.get('G02'), 'unavailable');
		assert.equal(statuses.get('M07'), 'unavailable');
		await applyEvent(deps, 'E-06');
		assert.equal((await store.listResources()).find((r) => r.name === 'M07')?.status, 'available');
		assert.deepEqual((await store.listEvents()).map((e) => e.eventRef), ['E-04', 'E-05', 'E-06']);
	});

	it('a check-in with no time is at the demo time now', async () => {
		const { deps, store } = testDeps();
		await applyReset(deps, 'R0');
		await setDemoClock(deps, '2026-06-16 11:45', false);
		await addCheckIn(deps, 'R-03', null);
		const r03 = (await store.listReservations()).find((r) => r.referenceNumber === 'R-03');
		assert.equal(r03?.checkedInAt?.toISOString(), local('2026-06-16 11:45').toISOString());
	});

	it('a check-in before the reservation starts is refused', async () => {
		const { deps } = testDeps();
		await applyReset(deps, 'R0');
		const report = await addCheckIn(deps, 'R-03', '2026-06-16 08:00');
		assert.equal(report.ok, false);
	});

	it('loading a reservation set replaces reservations and keeps resources', async () => {
		const { deps, store } = testDeps();
		await applyReset(deps, 'R0');
		await applyEvent(deps, 'E-04');
		await loadReservationSet(deps, 'fri-19');
		assert.deepEqual((await store.listReservations()).map((r) => r.referenceNumber), ['R-21']);
		assert.equal((await store.listResources()).find((r) => r.name === 'G02')?.status, 'unavailable');
	});
});

describe('resets (CRP script §3.4)', () => {
	async function dayUnderWay() {
		const t = testDeps();
		await applyReset(t.deps, 'R0');
		await setDemoClock(t.deps, '2026-06-16 10:00', false);
		await applyEvent(t.deps, 'E-01');
		await applyEvent(t.deps, 'E-04');
		await handleApi(get('Resources/'), 'Resources/', t.deps);
		return t;
	}

	it('R1: baseline back, check-ins and events gone, clock 08:05, request log kept', async () => {
		const { deps, store } = await dayUnderWay();
		const report = await applyReset(deps, 'R1');
		assert.equal(report.ok, true);
		assert.ok((await store.listReservations()).every((r) => r.checkedInAt === null));
		assert.equal((await store.listResources()).find((r) => r.name === 'G02')?.status, 'available');
		assert.equal((await store.listEvents()).length, 0);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-16 08:05').toISOString());
		assert.equal(store.requests.length, 1);
	});

	it('R2: as R0 but D3 without entry 1044, clock 16:20', async () => {
		const { planner, calls } = fakePlanner();
		const { deps } = testDeps({ planner });
		const report = await applyReset(deps, 'R2');
		assert.deepEqual(report.skipped, []);
		const call = calls.find((c) => c.name === 'resetPlannerData');
		const args = call?.args as { withoutEntryIds: string[]; forecasts: unknown[] };
		assert.deepEqual(args.withoutEntryIds, ['1044']);
		assert.equal(args.forecasts.length, 80);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-16 16:20').toISOString());
	});

	it('R3: reservation set fri-19 only, clock Fri 19 June 09:00', async () => {
		const { deps, store } = await dayUnderWay();
		await applyReset(deps, 'R3');
		assert.deepEqual((await store.listReservations()).map((r) => r.referenceNumber), ['R-21']);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-19 09:00').toISOString());
	});

	it('R3a: no reservations; D1 to D3 and the clock left alone', async () => {
		const { planner, calls } = fakePlanner();
		const { deps, store } = testDeps({ planner });
		await setDemoClock(deps, '2026-06-19 09:00', false);
		await applyReset(deps, 'R3a');
		assert.equal((await store.listReservations()).length, 0);
		assert.equal((await store.listResources()).length, 19);
		assert.equal(calls.length, 0);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-19 09:00').toISOString());
	});

	it('a running clock stays running through a reset', async () => {
		const { deps, advance } = testDeps();
		await setDemoClock(deps, '2026-06-16 07:00', true);
		await applyReset(deps, 'R1');
		advance(60_000);
		assert.equal((await currentDemoTime(deps)).toISOString(), local('2026-06-16 08:06').toISOString());
	});

	it('O-01 deletes the 14:30Z period; O-01r reloads 16 June\'s 19 periods', async () => {
		const { planner, calls } = fakePlanner();
		const { deps } = testDeps({ planner });
		await applyOverride(deps, 'O-01');
		await applyOverride(deps, 'O-01r');
		const del = calls[0].args as { region: string; periodStart: Date };
		assert.equal(del.region, 'South England');
		assert.equal(del.periodStart.toISOString(), '2026-06-16T14:30:00.000Z');
		assert.equal((calls[1].args as unknown[]).length, 19);
	});

	it('O-01 without route A\'s loader says so and does nothing', async () => {
		const { deps } = testDeps();
		const report = await applyOverride(deps, 'O-01');
		assert.equal(report.ok, false);
		assert.match(report.skipped[0], /route A/i);
	});
});

describe('tester console access', () => {
	it('is off in public demo mode, whatever the key', () => {
		assert.equal(consoleAccess({ publicDemo: true, key: 'k', cookie: consoleToken('k') }), 'off');
	});

	it('is locked without GM_STANDIN_CONSOLE_KEY', () => {
		assert.equal(consoleAccess({ publicDemo: false, key: undefined, cookie: undefined }), 'no-key');
	});

	it('opens only with the right key', () => {
		assert.equal(consoleAccess({ publicDemo: false, key: 'k', cookie: undefined }), 'locked');
		assert.equal(consoleAccess({ publicDemo: false, key: 'k', cookie: consoleToken('wrong') }), 'locked');
		assert.equal(consoleAccess({ publicDemo: false, key: 'k', cookie: consoleToken('k') }), 'open');
		assert.equal(keyMatches('k', 'k'), true);
		assert.equal(keyMatches('K', 'k'), false);
	});

	it('the cookie never holds the key itself', () => {
		assert.ok(!consoleToken('secret-key').includes('secret-key'));
	});
});
