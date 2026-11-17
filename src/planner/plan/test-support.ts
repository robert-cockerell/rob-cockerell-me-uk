// Appendix A, from test-data/, as process 2's inputs. Tests only.

import bikesCsv from '../../../test-data/bikes.csv?raw';
import entriesCsv from '../../../test-data/entries.csv?raw';
import forecastsCsv from '../../../test-data/forecasts.csv?raw';
import reservationsCsv from '../../../test-data/lb-reservations.csv?raw';
import resourcesCsv from '../../../test-data/lb-resources.csv?raw';
import { parseCsv } from '../fixtures/csv.ts';
import { parseLondonLocal } from '../time/london.ts';
import { buildDayPlan } from './day-plan.ts';
import type {
	DayPlan,
	DayPlanInput,
	IndexBand,
	OpenBikeFault,
	PlanBike,
	PlanForecast,
	PlanReservation,
	PlanResource,
	ResourceStatus,
} from './types.ts';
import { dueLabel, STATE_LABELS } from './wording.ts';

/** A UK local "YYYY-MM-DD HH:MM" as an instant. */
export function at(local: string): Date {
	const d = parseLondonLocal(local);
	if (!d) throw new Error(`Bad local time ${local}`);
	return d;
}

export const BIKES: PlanBike[] = parseCsv(bikesCsv).map((r) => ({
	bikeAssetTag: r.bike_asset_tag as string,
	librebookingResourceId: Number(r.librebooking_resource_id),
}));

const RESOURCES: PlanResource[] = parseCsv(resourcesCsv).map((r) => ({
	resourceId: Number(r.librebooking_resource_id),
	status: r.resource_status as ResourceStatus,
}));

const RESERVATIONS = parseCsv(reservationsCsv).map((r) => ({
	set: r.fixture_set as string,
	ref: r.reservation_ref as string,
	resourceId: Number(r.librebooking_resource_id),
	start: at(r.reservation_start as string),
	end: at(r.reservation_end as string),
}));

export const FORECASTS: PlanForecast[] = parseCsv(forecastsCsv).map((r) => ({
	periodStart: new Date((r.period_start as string).replace('Z', ':00Z')),
	indexBand: r.index_band as IndexBand,
	forecastIntensity: Number(r.forecast_intensity),
}));

const OPEN_BIKE_FAULTS: OpenBikeFault[] = parseCsv(entriesCsv)
	.filter((e) => e.entry_type === 'fault' && e.cleared_date === null && e.bike_asset_tag !== null)
	.map((e) => ({ bikeAssetTag: e.bike_asset_tag as string, entryId: Number(e.entry_id) }));

const RESOURCE_OF: Record<string, number> = Object.fromEntries(BIKES.map((b) => [b.bikeAssetTag, b.librebookingResourceId]));

export interface Scenario {
	/** Demo time, UK local. */
	now: string;
	/** Reservation set from lb-reservations.csv (default main). */
	set?: 'main' | 'fri-19' | 'none';
	/** Check-ins by reservation ref, UK local, as the stand-in's events add them. */
	checkIns?: Record<string, string>;
	/** Resource status changes by bike tag (AC-02.1, AC-02.7). */
	status?: Record<string, ResourceStatus>;
	/** Extra reservations by bike tag, UK local start and end. */
	extraReservations?: { bike: string; start: string; end: string }[];
	/** Bike resource ID changes (AC-02.8). */
	resourceIds?: Record<string, number>;
	/** Forecast periods to leave out, by UTC start (AC-01.3). */
	withoutPeriods?: string[];
	/** Open bike faults; default entries.csv (M07's 1043). */
	openBikeFaults?: OpenBikeFault[];
	/** LibreBooking unreachable. */
	bookingsDown?: boolean;
}

export function scenarioInput(s: Scenario): DayPlanInput {
	const set = s.set ?? 'main';
	const reservations: PlanReservation[] = RESERVATIONS.filter((r) => r.set === set).map((r) => ({
		resourceId: r.resourceId,
		start: r.start,
		end: r.end,
		checkedInAt: s.checkIns?.[r.ref] ? at(s.checkIns[r.ref]) : null,
	}));
	for (const extra of s.extraReservations ?? []) {
		reservations.push({ resourceId: RESOURCE_OF[extra.bike], start: at(extra.start), end: at(extra.end), checkedInAt: null });
	}
	const resources = RESOURCES.map((r) => {
		const bike = Object.keys(RESOURCE_OF).find((tag) => RESOURCE_OF[tag] === r.resourceId);
		const status = bike && s.status?.[bike];
		return status ? { ...r, status } : r;
	});
	const leaveOut = new Set((s.withoutPeriods ?? []).map((p) => new Date(p).getTime()));
	return {
		now: at(s.now),
		bikes: BIKES.map((b) => ({ ...b, librebookingResourceId: s.resourceIds?.[b.bikeAssetTag] ?? b.librebookingResourceId })),
		bookings: s.bookingsDown ? null : { resources, reservations },
		forecasts: FORECASTS.filter((f) => !leaveOut.has(f.periodStart.getTime())),
		openBikeFaults: s.openBikeFaults ?? OPEN_BIKE_FAULTS,
	};
}

export function plan(s: Scenario): DayPlan {
	return buildDayPlan(scenarioInput(s));
}

/** A bike's state in a slot, as shown: "Overdue – not checked in, due 11:00". */
export function shown(p: DayPlan, bike: string, time: string): string {
	const slot = p.slots.find((s) => s.time === time);
	const state = slot?.bikes.find((b) => b.bikeAssetTag === bike);
	if (!state) throw new Error(`No ${bike} in slot ${time}`);
	const label = STATE_LABELS[state.state];
	return state.dueAt ? `${label}, ${dueLabel(state.dueAt, p.planDate)}` : label;
}

/** A bike's state in every slot from `from` to `to` inclusive, de-duplicated. */
export function shownFromTo(p: DayPlan, bike: string, from: string, to: string): string[] {
	const times = p.slots.map((s) => s.time).filter((t) => t >= from && t <= to);
	return [...new Set(times.map((t) => shown(p, bike, t)))];
}

export function bikeOf(p: DayPlan, bike: string) {
	const found = p.bikes.find((b) => b.bikeAssetTag === bike);
	if (!found) throw new Error(`No ${bike} on the plan`);
	return found;
}
