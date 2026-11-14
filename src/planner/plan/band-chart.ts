// C18 Band chart (DEC-76): today's 19 slots as bars filled with the band
// colour, heights relative to the day's lowest and highest forecast. No
// figures, axis, tooltip, highlighted window or advice (DEC-32 as refined).

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

export function bandChart(plan: DayPlan): BandChart {
	const now = plan.now.getTime();
	const bars = plan.slots.map((s) => ({
		time: s.time,
		band: s.band,
		height: s.band === null ? NO_FORECAST : s.level === null ? UNKNOWN : LOWEST + (1 - LOWEST) * s.level,
		now: s.start.getTime() <= now && now < s.end.getTime(),
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
