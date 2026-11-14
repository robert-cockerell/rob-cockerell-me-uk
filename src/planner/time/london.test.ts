import { describe, expect, it } from 'vitest';
import { parseLondonLocal } from './london.ts';

describe('parseLondonLocal', () => {
	it('reads summer time (BST, UTC+1)', () => {
		expect(parseLondonLocal('2026-06-16 07:00')?.toISOString()).toBe('2026-06-16T06:00:00.000Z');
	});

	it('reads winter time (GMT)', () => {
		expect(parseLondonLocal('2026-12-08 07:00')?.toISOString()).toBe('2026-12-08T07:00:00.000Z');
	});

	it('S14 Mon 30 March 2026, the day after the clocks go forward', () => {
		expect(parseLondonLocal('2026-03-30 09:00')?.toISOString()).toBe('2026-03-30T08:00:00.000Z');
	});

	it('S14 Mon 26 October 2026, the day after the clocks go back', () => {
		expect(parseLondonLocal('2026-10-26 09:00')?.toISOString()).toBe('2026-10-26T09:00:00.000Z');
	});

	it('refuses other forms and impossible dates', () => {
		expect(parseLondonLocal('16/06/2026 07:00')).toBeNull();
		expect(parseLondonLocal('2026-06-16T07:00')).toBeNull();
		expect(parseLondonLocal('2026-06-31 07:00')).toBeNull();
		expect(parseLondonLocal('2026-06-16 24:00')).toBeNull();
	});
});
