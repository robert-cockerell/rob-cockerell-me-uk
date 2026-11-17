// C18 Band chart (DEC-76, DEC-80): today's slots as bars filled with the band
// colour, heights relative to the day's lowest and highest forecast, the
// hours in small text under the bars. No figures, axis values, tooltip,
// highlighted window or advice (DEC-32 as refined). DEC-82: on phones,
// "Rest of day" draws only the slots from the current one.

import type { DayPlan, IndexBand } from './types.ts';
import { bandLabel } from './wording.ts';

/** Anchors the bars link to: the timeline's slot, or the grid's column. */
export const slotAnchor = (time: string) => `slot-${time.replace(':', '')}`;
export const gridAnchor = (time: string) => `grid-${time.replace(':', '')}`;

/** Bar heights as a share of the drawing: the day's lowest still shows. */
const LOWEST = 0.25;
const NO_FORECAST = 0.12;
const UNKNOWN = 0.5;

export interface ChartBar {
	time: string;
	band: IndexBand | null;
	/** 0 to 1 of the drawing's height. */
	height: number;
	now: boolean;
	/** "07" under the bar for each whole hour (DEC-80); null on the half hours. */
	hour: string | null;
}

export interface ChartStretch {
	band: IndexBand | null;
	/** "07:00–09:30", or "16:00" for one slot. */
	times: string;
	/** For the drawing's description: "07:00 to 09:30 moderate". */
	spoken: string;
}

export interface BandChart {
	bars: ChartBar[];
	stretches: ChartStretch[];
	/** The <desc>: every stretch, no figures. */
	description: string;
}

/** `start`: the first slot to draw, an index into plan.slots (DEC-82). */
export function bandChart(plan: DayPlan, start = 0): BandChart {
	const now = plan.now.getTime();
	const bars = plan.slots.slice(start).map((s) => ({
		time: s.time,
		band: s.band,
		height: s.band === null ? NO_FORECAST : s.level === null ? UNKNOWN : LOWEST + (1 - LOWEST) * s.level,
		now: s.start.getTime() <= now && now < s.end.getTime(),
		hour: s.time.endsWith(':00') ? s.time.slice(0, 2) : null,
	}));

	const stretches: ChartStretch[] = [];
	let from = 0;
	for (let i = 1; i <= bars.length; i++) {
		if (i < bars.length && bars[i].band === bars[from].band) continue;
		const first = bars[from].time;
		const last = bars[i - 1].time;
		const name = bandLabel(bars[from].band);
		stretches.push({
			band: bars[from].band,
			times: first === last ? first : `${first}–${last}`,
			spoken: first === last ? `${first} ${name}` : `${first} to ${last} ${name}`,
		});
		from = i;
	}
	return { bars, stretches, description: stretches.map((s) => s.spoken).join(', ') };
}

/** The cookie that remembers whether the chart is open (DEC-76). */
export const BAND_CHART_COOKIE = 'gm_bandchart';
