// Server wiring for planner pages: settings from astro:env (technical note
// §7.1), the database, the LibreBooking client and process 2. Server only.

import {
	GM_DEMO_MODE,
	GM_FORECAST_JOB_SECRET,
	GM_HANDBOOK_URL,
	GM_LIBREBOOKING_URL,
	GM_PUBLIC_DEMO,
	GM_SUPABASE_SERVICE_KEY,
	GM_SUPABASE_URL,
} from 'astro:env/server';
import type { Clock } from './clock/clock.ts';
import { createDbClient } from './db/client.ts';
import { createDayPlanData } from './db/day-plan-data.ts';
import { loadDayPlan } from './day-plan/load.ts';
import { createFleetRepo, type FleetRepo } from './fleet/repo.ts';
import { createLibreBookingClient } from './librebooking/client.ts';

export const settings = {
	demoMode: GM_DEMO_MODE,
	publicDemo: GM_PUBLIC_DEMO,
	handbookUrl: GM_HANDBOOK_URL ?? null,
};

export class PlannerNotConfigured extends Error {}

export const librebookingUrl = () => GM_LIBREBOOKING_URL;
export const forecastJobSecret = () => GM_FORECAST_JOB_SECRET ?? null;

export function db() {
	if (!GM_SUPABASE_URL || !GM_SUPABASE_SERVICE_KEY) {
		throw new PlannerNotConfigured('GM_SUPABASE_URL and GM_SUPABASE_SERVICE_KEY must be set');
	}
	return createDbClient({ url: GM_SUPABASE_URL, serviceKey: GM_SUPABASE_SERVICE_KEY });
}

export function fleet(): FleetRepo {
	return createFleetRepo(db());
}

export function dayPlan(clock: Clock) {
	return loadDayPlan({
		clock,
		data: createDayPlanData(db()),
		librebooking: GM_LIBREBOOKING_URL ? createLibreBookingClient({ baseUrl: GM_LIBREBOOKING_URL }) : null,
		log: (message) => console.error(`[day plan] ${message}`),
	});
}
