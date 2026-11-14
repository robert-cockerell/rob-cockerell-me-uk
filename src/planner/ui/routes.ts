// The planner's addresses, under /demos/charging-planner/ (DEC-47).

export const BASE = '/demos/charging-planner';

export const routes = {
	dayPlan: `${BASE}/`,
	fleet: `${BASE}/fleet/`,
	namePicker: `${BASE}/name/`,
	bike: (tag: string) => `${BASE}/fleet/bikes/${encodeURIComponent(tag)}/`,
	favicon: `${BASE}/favicon.svg`,
};

/** The picked name's cookie (technical note §6.3). Not a login. */
export const NAME_COOKIE = 'gm_name';
