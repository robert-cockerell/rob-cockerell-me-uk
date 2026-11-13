// Everything the tester console and `npm run demo:reset` can do (Stage 1 items
// 3 to 5, CRP script §3.4). One set of functions, so the console and the
// command line run the same code.

import type { ForecastFixtureRow, PlannerFixtures } from '../demo-fixtures.ts';
import { demoNow, setClock, setRunning } from './clock.ts';
import {
	forecastsOnUtcDate,
	parseClockSettings,
	parseEvents,
	parseForecasts,
	parseReservations,
	parseResets,
	parseResources,
	reservationsInSet,
	type FixtureTexts,
	type ReservationSet,
} from './fixtures.ts';
import { formatLondonLocal, parseLondonLocal } from './london.ts';
import type { ResourceStatus, StandinStore } from './types.ts';

export interface OperationDeps {
	store: StandinStore;
	fixtures: FixtureTexts;
	/** Route A's D1 to D3 loader, or null before its schema exists (DEC-55). */
	planner: PlannerFixtures | null;
	systemNow: () => Date;
}

/** What an operation did, in words for the console and the command line. */
export interface OperationReport {
	ok: boolean;
	done: string[];
	skipped: string[];
}

const NO_PLANNER_LOADER =
	"D1, D2 and D3 weren't reloaded: there's no loader yet. Route A adds it once its schema is approved (DEC-55)";
const NO_D1_LOADER =
	"D1 wasn't changed: there's no loader yet. Route A adds it once its schema is approved (DEC-55)";

// ---------------------------------------------------------------- resets

export const RESET_IDS = ['R0', 'R1', 'R2', 'R3', 'R3a'] as const;
export type ResetId = (typeof RESET_IDS)[number];
export const OVERRIDE_IDS = ['O-01', 'O-01r'] as const;
export type OverrideId = (typeof OVERRIDE_IDS)[number];

interface ResetPlan {
	reservationSet: ReservationSet;
	/** Europe/London local time to set the clock to, or null to leave it. */
	clock: string | null;
	/** Reload D1 to D3, leaving out these entry IDs; null leaves D1 to D3 alone. */
	planner: { withoutEntryIds: string[] } | null;
	/** Only R0, the start of a run, empties the request log (SU.05). */
	clearRequestLog: boolean;
}

/** resets-and-overrides.csv, as code. A test checks every row has a plan. */
export const RESET_PLANS: Record<ResetId, ResetPlan> = {
	R0: { reservationSet: 'main', clock: null, planner: { withoutEntryIds: [] }, clearRequestLog: true },
	R1: { reservationSet: 'main', clock: '2026-06-16 08:05', planner: { withoutEntryIds: [] }, clearRequestLog: false },
	R2: { reservationSet: 'main', clock: '2026-06-16 16:20', planner: { withoutEntryIds: ['1044'] }, clearRequestLog: false },
	R3: { reservationSet: 'fri-19', clock: '2026-06-19 09:00', planner: { withoutEntryIds: [] }, clearRequestLog: false },
	R3a: { reservationSet: 'none', clock: null, planner: null, clearRequestLog: false },
};

/** O-01 deletes this period; O-01r reloads this date's rows. */
export const O01_REGION = 'South England';
export const O01_PERIOD_START = new Date('2026-06-16T14:30:00Z');
export const O01R_UTC_DATE = '2026-06-16';

export function isResetId(id: string): id is ResetId {
	return (RESET_IDS as readonly string[]).includes(id);
}
export function isOverrideId(id: string): id is OverrideId {
	return (OVERRIDE_IDS as readonly string[]).includes(id);
}

/** Apply a reset as CRP script §3.4. */
export async function applyReset(deps: OperationDeps, id: ResetId): Promise<OperationReport> {
	const plan = RESET_PLANS[id];
	const report: OperationReport = { ok: true, done: [], skipped: [] };

	// Check every file before changing anything.
	const resources = parseResources(deps.fixtures.resources);
	const reservations = reservationsInSet(parseReservations(deps.fixtures.reservations), plan.reservationSet);
	const forecasts = parseForecasts(deps.fixtures.forecasts);

	// 1. D1 to D3.
	if (plan.planner) {
		if (deps.planner) {
			await deps.planner.resetPlannerData({ withoutEntryIds: plan.planner.withoutEntryIds, forecasts });
			const without = plan.planner.withoutEntryIds.length
				? `, without entry ${plan.planner.withoutEntryIds.join(', ')}`
				: '';
			report.done.push(`D1, D2 and D3 reloaded from test-data${without}`);
		} else {
			report.skipped.push(NO_PLANNER_LOADER);
		}
	} else {
		report.done.push('D1, D2 and D3 left as they are');
	}

	// 2. Stand-in resources and reservations; events cleared; request log kept.
	await deps.store.replaceStandinData(resources, reservations);
	await deps.store.clearEvents();
	report.done.push(
		`Stand-in reloaded: ${resources.length} resources, reservation set "${plan.reservationSet}" ` +
			`(${reservations.length} reservations), no check-ins, events cleared`,
	);

	// 3. Clock.
	if (plan.clock) {
		const current = await deps.store.getClock();
		const at = parseLondonLocal(plan.clock) as Date;
		await deps.store.saveClock(setClock(at, current.running, deps.systemNow()));
		report.done.push(`Demo clock set to ${plan.clock}${current.running ? ', running' : ''}`);
	} else {
		report.done.push('Demo clock left as it is');
	}

	if (plan.clearRequestLog) {
		await deps.store.clearRequestLog();
		report.done.push('Request log emptied for the start of the run');
	} else {
		report.done.push('Request log kept');
	}
	return report;
}

/** Apply forecast override O-01 or O-01r (S1.12, S1.13). */
export async function applyOverride(deps: OperationDeps, id: OverrideId): Promise<OperationReport> {
	if (!deps.planner) return { ok: false, done: [], skipped: [NO_D1_LOADER] };
	if (id === 'O-01') {
		await deps.planner.deleteForecastPeriod(O01_REGION, O01_PERIOD_START);
		return { ok: true, done: [`Deleted ${O01_REGION} period ${O01_PERIOD_START.toISOString()} from D1`], skipped: [] };
	}
	const rows: ForecastFixtureRow[] = forecastsOnUtcDate(parseForecasts(deps.fixtures.forecasts), O01R_UTC_DATE);
	await deps.planner.reloadForecasts(rows);
	return { ok: true, done: [`Reloaded ${rows.length} D1 periods for ${O01R_UTC_DATE} from forecasts.csv`], skipped: [] };
}

/** Load one reservation set on its own. Check-ins go; resources and events stay. */
export async function loadReservationSet(deps: OperationDeps, set: ReservationSet): Promise<OperationReport> {
	const reservations = reservationsInSet(parseReservations(deps.fixtures.reservations), set);
	await deps.store.replaceReservations(reservations);
	return { ok: true, done: [`Reservation set "${set}" loaded: ${reservations.length} reservations, no check-ins`], skipped: [] };
}

// ---------------------------------------------------------------- clock

export async function setDemoClock(deps: OperationDeps, local: string, running: boolean): Promise<OperationReport> {
	const at = parseLondonLocal(local);
	if (!at) return { ok: false, done: [], skipped: [`"${local}" isn't a date and time`] };
	await deps.store.saveClock(setClock(at, running, deps.systemNow()));
	return { ok: true, done: [`Demo clock set to ${formatLondonLocal(at)}${running ? ', running' : ', held'}`], skipped: [] };
}

/** Set the clock to a row of demo-clock.csv, by its order number. */
export async function setDemoClockPreset(deps: OperationDeps, order: number, running: boolean): Promise<OperationReport> {
	const preset = parseClockSettings(deps.fixtures.clock).find((c) => c.order === order);
	if (!preset) return { ok: false, done: [], skipped: [`No demo-clock.csv row ${order}`] };
	return setDemoClock(deps, preset.local, running);
}

export async function setDemoClockRunning(deps: OperationDeps, running: boolean): Promise<OperationReport> {
	const state = await deps.store.getClock();
	const next = setRunning(state, running, deps.systemNow());
	await deps.store.saveClock(next);
	return {
		ok: true,
		done: [`Demo clock ${running ? 'running on' : 'held'} from ${formatLondonLocal(next.demoAt)}`],
		skipped: [],
	};
}

export async function currentDemoTime(deps: Pick<OperationDeps, 'store' | 'systemNow'>): Promise<Date> {
	return demoNow(await deps.store.getClock(), deps.systemNow());
}

// ---------------------------------------------------------------- stand-in changes

export async function setResourceStatus(
	deps: OperationDeps,
	resourceId: number,
	status: ResourceStatus,
	eventRef: string | null = null,
): Promise<OperationReport> {
	const ok = await deps.store.setResourceStatus(resourceId, status);
	if (!ok) return { ok: false, done: [], skipped: [`No resource ${resourceId}`] };
	const system = deps.systemNow();
	await deps.store.addEvent({
		eventRef,
		action: 'set resource status',
		resourceId,
		reservationRef: null,
		value: status,
		demoAt: demoNow(await deps.store.getClock(), system),
		appliedAt: system,
	});
	return { ok: true, done: [`Resource ${resourceId} set ${status}${eventRef ? ` (${eventRef})` : ''}`], skipped: [] };
}

/** Check a bike in against a reservation. With no time given, at the demo time now. */
export async function addCheckIn(
	deps: OperationDeps,
	referenceNumber: string,
	local: string | null,
	eventRef: string | null = null,
): Promise<OperationReport> {
	const system = deps.systemNow();
	const now = demoNow(await deps.store.getClock(), system);
	const at = local ? parseLondonLocal(local) : now;
	if (!at) return { ok: false, done: [], skipped: [`"${local}" isn't a date and time`] };
	const reservation = (await deps.store.listReservations()).find((r) => r.referenceNumber === referenceNumber);
	if (!reservation) return { ok: false, done: [], skipped: [`No reservation ${referenceNumber}`] };
	if (at < reservation.startsAt) {
		return {
			ok: false,
			done: [],
			skipped: [`${formatLondonLocal(at)} is before ${referenceNumber} starts (${formatLondonLocal(reservation.startsAt)})`],
		};
	}
	await deps.store.setCheckIn(referenceNumber, at);
	await deps.store.addEvent({
		eventRef,
		action: 'check in',
		resourceId: reservation.resourceId,
		reservationRef: referenceNumber,
		value: formatLondonLocal(at),
		demoAt: now,
		appliedAt: system,
	});
	return {
		ok: true,
		done: [`${referenceNumber} checked in at ${formatLondonLocal(at)}${eventRef ? ` (${eventRef})` : ''}`],
		skipped: [],
	};
}

/** Apply a row of stand-in-events.csv. The clock isn't moved: set it first, as the script does. */
export async function applyEvent(deps: OperationDeps, eventId: string): Promise<OperationReport> {
	const event = parseEvents(deps.fixtures.events).find((e) => e.eventId === eventId);
	if (!event) return { ok: false, done: [], skipped: [`No event ${eventId} in stand-in-events.csv`] };
	if (event.action === 'check in') {
		return addCheckIn(deps, event.reservationRef as string, event.value, event.eventId);
	}
	return setResourceStatus(deps, event.resourceId, event.value as ResourceStatus, event.eventId);
}

/** IDs in resets-and-overrides.csv that have no implementation (should be none). */
export function unimplementedResetRows(fixtures: FixtureTexts): string[] {
	return parseResets(fixtures.resets)
		.map((r) => r.id)
		.filter((id) => !isResetId(id) && !isOverrideId(id));
}
