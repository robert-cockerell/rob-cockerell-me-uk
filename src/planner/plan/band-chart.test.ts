import { describe, expect, it } from 'vitest';
import { bandChart } from './band-chart.ts';
import { plan } from './test-support.ts';

describe('C18 band chart (DEC-76)', () => {
	it('19 bars from 07:00, filled with each slot\'s band', () => {
		const chart = bandChart(plan({ now: '2026-06-16 07:00' }));
		expect(chart.bars).toHaveLength(19);
		expect(chart.bars[0].time).toBe('07:00');
		expect(chart.bars[12].band).toBe('very low');
	});

	it('heights are relative: the day\'s lowest is shortest but still shows, the highest is full height', () => {
		const chart = bandChart(plan({ now: '2026-06-16 07:00' }));
		const heights = chart.bars.map((b) => b.height);
		expect(Math.max(...heights)).toBe(1);
		expect(Math.min(...heights)).toBe(0.25);
		const tallestVeryLow = Math.max(...chart.bars.filter((b) => b.band === 'very low').map((b) => b.height));
		const shortestModerate = Math.min(...chart.bars.filter((b) => b.band === 'moderate').map((b) => b.height));
		expect(tallestVeryLow).toBeLessThan(shortestModerate);
	});

	it('one label per stretch of the same band, and a description with no figures', () => {
		const chart = bandChart(plan({ now: '2026-06-16 07:00' }));
		expect(chart.stretches.map((s) => `${s.band} ${s.times}`)).toEqual([
			'moderate 07:00–09:30',
			'low 10:00–11:30',
			'very low 12:00–13:30',
			'low 14:00–15:30',
			'moderate 16:00',
		]);
		expect(chart.description).toBe('07:00 to 09:30 moderate, 10:00 to 11:30 low, 12:00 to 13:30 very low, 14:00 to 15:30 low, 16:00 moderate');
		// Only times: every digit is part of an HH:MM.
		expect(chart.description.split(/\d{2}:\d{2}/).join('')).not.toMatch(/\d/);
	});

	it('a slot with no forecast is a short bar and its own stretch, "No forecast"', () => {
		const chart = bandChart(plan({ now: '2026-06-16 07:00', withoutPeriods: ['2026-06-16T14:30:00Z'] }));
		expect(chart.bars[17]).toMatchObject({ time: '15:30', band: null, height: 0.12 });
		expect(chart.stretches.find((s) => s.band === null)?.spoken).toBe('15:30 No forecast');
	});

	it('marks the current slot as now', () => {
		expect(bandChart(plan({ now: '2026-06-16 12:10' })).bars.filter((b) => b.now).map((b) => b.time)).toEqual(['12:00']);
		expect(bandChart(plan({ now: '2026-06-16 06:30' })).bars.some((b) => b.now)).toBe(false);
	});
});
