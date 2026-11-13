// Run with: npm run test:standin (Node's own test runner; see README.md).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	addDays,
	formatIsoLondon,
	formatLondonLocal,
	londonZoneName,
	parseLondonLocal,
	parseQueryDateTime,
	startOfLondonDay,
} from './london.ts';

describe('Europe/London conversions', () => {
	it('reads a BST local time as an hour ahead of UTC', () => {
		assert.equal(parseLondonLocal('2026-06-16 07:00')?.toISOString(), '2026-06-16T06:00:00.000Z');
	});

	it('reads a GMT local time as UTC', () => {
		assert.equal(parseLondonLocal('2026-12-08 07:00')?.toISOString(), '2026-12-08T07:00:00.000Z');
	});

	it('handles both clock-change Mondays (S14)', () => {
		assert.equal(parseLondonLocal('2026-03-30 09:00')?.toISOString(), '2026-03-30T08:00:00.000Z');
		assert.equal(parseLondonLocal('2026-10-26 09:00')?.toISOString(), '2026-10-26T09:00:00.000Z');
		// The weekends the clocks change.
		assert.equal(parseLondonLocal('2026-03-29 03:00')?.toISOString(), '2026-03-29T02:00:00.000Z');
		assert.equal(parseLondonLocal('2026-10-25 03:00')?.toISOString(), '2026-10-25T03:00:00.000Z');
	});

	it('refuses dates and times that are not real', () => {
		assert.equal(parseLondonLocal('2026-02-30 09:00'), null);
		assert.equal(parseLondonLocal('2026-06-16 24:00'), null);
		assert.equal(parseLondonLocal('16/06/2026 09:00'), null);
	});

	it('formats instants as London local time and ISO with offset', () => {
		const d = new Date('2026-06-16T08:00:00Z');
		assert.equal(formatLondonLocal(d), '2026-06-16 09:00');
		assert.equal(formatIsoLondon(d), '2026-06-16T09:00:00+01:00');
		assert.equal(formatIsoLondon(new Date('2026-12-08T15:00:00Z')), '2026-12-08T15:00:00+00:00');
		assert.equal(londonZoneName(d), 'BST');
	});

	it('reads query date-times with and without a zone', () => {
		assert.equal(parseQueryDateTime('2026-06-16T00:00:00+01:00')?.toISOString(), '2026-06-15T23:00:00.000Z');
		assert.equal(parseQueryDateTime('2026-06-16T00:00:00+0100')?.toISOString(), '2026-06-15T23:00:00.000Z');
		assert.equal(parseQueryDateTime('2026-06-15T23:00:00Z')?.toISOString(), '2026-06-15T23:00:00.000Z');
		assert.equal(parseQueryDateTime('2026-06-16')?.toISOString(), '2026-06-15T23:00:00.000Z');
		assert.equal(parseQueryDateTime('2026-06-16T09:00')?.toISOString(), '2026-06-16T08:00:00.000Z');
		assert.equal(parseQueryDateTime('2026-06-16 09:00:00')?.toISOString(), '2026-06-16T08:00:00.000Z');
		assert.equal(parseQueryDateTime('tomorrow'), null);
	});

	it('finds the start of the London day and adds days', () => {
		assert.equal(startOfLondonDay(new Date('2026-06-16T10:00:00Z')).toISOString(), '2026-06-15T23:00:00.000Z');
		assert.equal(addDays('2026-06-19', 3), '2026-06-22');
		assert.equal(addDays('2026-12-31', 1), '2027-01-01');
	});
});
