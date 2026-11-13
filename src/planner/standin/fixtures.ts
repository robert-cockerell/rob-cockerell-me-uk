// Reading the fixture files in test-data/ (CRP script §3.2). Pure: takes the
// file text, returns checked rows, throws with the file and row on bad data.

import type { ForecastFixtureRow } from '../demo-fixtures.ts';
import { parseCsv, type CsvRecord } from './csv.ts';
import { londonZoneName, parseLondonLocal } from './london.ts';
import {
	EVENT_ACTIONS,
	RESOURCE_STATUSES,
	type EventAction,
	type Reservation,
	type Resource,
	type ResourceStatus,
} from './types.ts';

/** The text of each fixture file the stand-in reads. */
export interface FixtureTexts {
	resources: string;
	reservations: string;
	events: string;
	resets: string;
	clock: string;
	forecasts: string;
}

export const FIXTURE_FILES: Record<keyof FixtureTexts, string> = {
	resources: 'lb-resources.csv',
	reservations: 'lb-reservations.csv',
	events: 'stand-in-events.csv',
	resets: 'resets-and-overrides.csv',
	clock: 'demo-clock.csv',
	forecasts: 'forecasts.csv',
};

/** Reservation sets in lb-reservations.csv, plus `none` for reset R3a. */
export const RESERVATION_SETS = ['main', 'fri-19', 'none'] as const;
export type ReservationSet = (typeof RESERVATION_SETS)[number];

export class FixtureError extends Error {}

function fail(file: string, row: number, message: string): never {
	// Row numbers count the header as row 1, as a spreadsheet shows them.
	throw new FixtureError(`${file}, row ${row + 2}: ${message}`);
}

function required(file: string, i: number, record: CsvRecord, column: string): string {
	const value = record[column];
	if (value === undefined) fail(file, i, `no column "${column}"`);
	if (value.trim() === '') fail(file, i, `"${column}" is empty`);
	return value.trim();
}

function integer(file: string, i: number, record: CsvRecord, column: string): number {
	const text = required(file, i, record, column);
	if (!/^\d+$/.test(text)) fail(file, i, `"${column}" isn't a whole number: ${text}`);
	return Number(text);
}

function localDateTime(file: string, i: number, text: string, column: string): Date {
	if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(text)) fail(file, i, `"${column}" isn't YYYY-MM-DD HH:MM: ${text}`);
	const d = parseLondonLocal(text);
	if (!d) fail(file, i, `"${column}" isn't a real date and time: ${text}`);
	return d;
}

export function parseResources(text: string): Resource[] {
	const file = FIXTURE_FILES.resources;
	const seen = new Set<number>();
	return parseCsv(text).map((r, i) => {
		const resourceId = integer(file, i, r, 'librebooking_resource_id');
		if (seen.has(resourceId)) fail(file, i, `resource ${resourceId} appears twice`);
		seen.add(resourceId);
		const status = required(file, i, r, 'resource_status') as ResourceStatus;
		if (!RESOURCE_STATUSES.includes(status)) fail(file, i, `unknown resource status "${status}"`);
		return { resourceId, name: required(file, i, r, 'bike_ref_for_testers'), status };
	});
}

export interface ReservationFixture extends Reservation {
	bikeRef: string;
}

export function parseReservations(text: string): ReservationFixture[] {
	const file = FIXTURE_FILES.reservations;
	const seen = new Set<string>();
	return parseCsv(text).map((r, i) => {
		const referenceNumber = required(file, i, r, 'reservation_ref');
		if (seen.has(referenceNumber)) fail(file, i, `reservation ${referenceNumber} appears twice`);
		seen.add(referenceNumber);
		const startsAt = localDateTime(file, i, required(file, i, r, 'reservation_start'), 'reservation_start');
		const endsAt = localDateTime(file, i, required(file, i, r, 'reservation_end'), 'reservation_end');
		if (endsAt <= startsAt) fail(file, i, 'reservation_end isn\'t after reservation_start');
		const checkedText = (r.checked_in_at ?? '').trim();
		return {
			fixtureSet: required(file, i, r, 'fixture_set'),
			referenceNumber,
			resourceId: integer(file, i, r, 'librebooking_resource_id'),
			bikeRef: required(file, i, r, 'bike_ref_for_testers'),
			startsAt,
			endsAt,
			checkedInAt: checkedText === '' ? null : localDateTime(file, i, checkedText, 'checked_in_at'),
		};
	});
}

/** The reservations in one set. `none` is empty (reset R3a). */
export function reservationsInSet(all: ReservationFixture[], set: ReservationSet): Reservation[] {
	return all
		.filter((r) => r.fixtureSet === set)
		.map(({ bikeRef: _bikeRef, ...reservation }) => reservation);
}

export interface EventFixture {
	eventId: string;
	scenarioStep: string;
	demoAt: Date;
	actor: string;
	action: EventAction;
	resourceId: number;
	bikeRef: string;
	reservationRef: string | null;
	value: string;
}

export function parseEvents(text: string): EventFixture[] {
	const file = FIXTURE_FILES.events;
	return parseCsv(text).map((r, i) => {
		const action = required(file, i, r, 'action') as EventAction;
		if (!EVENT_ACTIONS.includes(action)) fail(file, i, `unknown action "${action}"`);
		const value = required(file, i, r, 'value');
		const reservationRef = (r.reservation_ref ?? '').trim() || null;
		if (action === 'check in') {
			if (!reservationRef) fail(file, i, 'a check-in needs a reservation_ref');
			localDateTime(file, i, value, 'value');
		} else if (!RESOURCE_STATUSES.includes(value as ResourceStatus)) {
			fail(file, i, `unknown resource status "${value}"`);
		}
		return {
			eventId: required(file, i, r, 'event_id'),
			scenarioStep: required(file, i, r, 'scenario_step'),
			demoAt: localDateTime(file, i, required(file, i, r, 'demo_clock'), 'demo_clock'),
			actor: required(file, i, r, 'actor'),
			action,
			resourceId: integer(file, i, r, 'librebooking_resource_id'),
			bikeRef: required(file, i, r, 'bike_ref_for_testers'),
			reservationRef,
			value,
		};
	});
}

export interface ResetFixture {
	id: string;
	beforeStep: string;
	store: string;
	action: string;
	detail: string;
}

export function parseResets(text: string): ResetFixture[] {
	const file = FIXTURE_FILES.resets;
	return parseCsv(text).map((r, i) => ({
		id: required(file, i, r, 'id'),
		beforeStep: required(file, i, r, 'before_step'),
		store: required(file, i, r, 'store'),
		action: required(file, i, r, 'action'),
		detail: required(file, i, r, 'detail'),
	}));
}

export interface ClockFixture {
	order: number;
	scenarioStep: string;
	demoAt: Date;
	local: string;
	ukOffset: 'GMT' | 'BST';
	note: string;
}

export function parseClockSettings(text: string): ClockFixture[] {
	const file = FIXTURE_FILES.clock;
	return parseCsv(text).map((r, i) => {
		const local = `${required(file, i, r, 'demo_date')} ${required(file, i, r, 'demo_time')}`;
		const demoAt = localDateTime(file, i, local, 'demo_date and demo_time');
		const ukOffset = required(file, i, r, 'uk_offset');
		if (ukOffset !== londonZoneName(demoAt)) {
			fail(file, i, `uk_offset says ${ukOffset} but ${local} in London is ${londonZoneName(demoAt)}`);
		}
		return {
			order: integer(file, i, r, 'order'),
			scenarioStep: required(file, i, r, 'scenario_step'),
			demoAt,
			local,
			ukOffset: ukOffset as 'GMT' | 'BST',
			note: (r.note ?? '').trim(),
		};
	});
}

const BANDS = ['very low', 'low', 'moderate', 'high', 'very high'] as const;
const PERIOD_START = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(00|30)Z$/;

/**
 * forecasts.csv, checked and ready to load into D1 (Stage 1 item 5). Period
 * starts are UTC on the half hour; there's no period end (DEC-13); Retrieved at
 * is stamped by the loader, not the file (DI-006, DEC-59).
 */
export function parseForecasts(text: string): ForecastFixtureRow[] {
	const file = FIXTURE_FILES.forecasts;
	const seen = new Set<string>();
	return parseCsv(text).map((r, i) => {
		const region = required(file, i, r, 'region');
		const startText = required(file, i, r, 'period_start');
		const m = PERIOD_START.exec(startText);
		if (!m || Number(m[2]) > 23) fail(file, i, `period_start isn't YYYY-MM-DDTHH:MMZ on the half hour: ${startText}`);
		const periodStart = new Date(`${m[1]}T${m[2]}:${m[3]}:00Z`);
		if (Number.isNaN(periodStart.getTime())) fail(file, i, `period_start isn't a real date: ${startText}`);
		const key = `${region}|${periodStart.toISOString()}`;
		if (seen.has(key)) fail(file, i, `${region} ${startText} appears twice`);
		seen.add(key);
		const indexBand = required(file, i, r, 'index_band') as ForecastFixtureRow['indexBand'];
		if (!BANDS.includes(indexBand)) fail(file, i, `unknown index band "${indexBand}"`);
		return { region, periodStart, forecastIntensity: integer(file, i, r, 'forecast_intensity'), indexBand };
	});
}

/** The forecast rows whose period starts on a UTC date, for override O-01r. */
export function forecastsOnUtcDate(rows: ForecastFixtureRow[], utcDate: string): ForecastFixtureRow[] {
	return rows.filter((r) => r.periodStart.toISOString().slice(0, 10) === utcDate);
}
