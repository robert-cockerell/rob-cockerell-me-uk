// LibreBooking stand-in API: GET Resources/ and Reservations/ (test equipment).
// Base URL for a build's LibreBooking client: <site>/demos/charging-planner/stand-in/api
import type { APIRoute } from 'astro';
import { handleApi } from '../../../../../planner/standin/api.ts';
import { standinDeps, StandinNotConfigured } from '../../../../../planner/standin/runtime.ts';

export const prerender = false;

export const ALL: APIRoute = async ({ request, params }) => {
	try {
		return await handleApi(request, params.path ?? '', standinDeps());
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
