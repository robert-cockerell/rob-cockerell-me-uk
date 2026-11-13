// The demo clock, read by a build's clock module in demo mode (test equipment).
import type { APIRoute } from 'astro';
import { handleClock } from '../../../../planner/standin/api.ts';
import { standinDeps, StandinNotConfigured } from '../../../../planner/standin/runtime.ts';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
	try {
		return await handleClock(request, standinDeps());
	} catch (error) {
		if (error instanceof StandinNotConfigured) {
			return new Response(JSON.stringify({ message: error.message }), {
				status: 503,
				headers: { 'Content-Type': 'application/json; charset=utf-8' },
			});
		}
		throw error;
	}
};
