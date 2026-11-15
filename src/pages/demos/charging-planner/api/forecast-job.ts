// Process 1's endpoint (DEC-48). pg_cron calls it every 30 minutes through
// pg_net on production; `npm run job:forecast` calls it locally (DEC-60).
// Protected by GM_FORECAST_JOB_SECRET, sent as a bearer token.
import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { systemNow } from '../../../../planner/clock/system-now.ts';
import { runForecastJob } from '../../../../planner/forecast/job.ts';
import { carbonIntensity, forecastJobDb } from '../../../../planner/forecast/sources.ts';
import { db, forecastJobSecret, settings } from '../../../../planner/server.ts';

export const prerender = false;

function authorised(header: string | null, secret: string): boolean {
	const given = Buffer.from(header?.replace(/^Bearer\s+/i, '') ?? '');
	const expected = Buffer.from(secret);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...(settings.publicDemo ? { 'X-Robots-Tag': 'noindex' } : {}) },
	});

export const POST: APIRoute = async ({ request }) => {
	// Public demo: the forecasts are frozen at the recorded scenario data (DEC-26,
	// DEC-59). Do nothing, so a pg_cron call left running can't write to D1.
	if (settings.publicDemo) return json({ message: 'Public demo: the forecasts are frozen, so nothing was fetched or saved' }, 200);
	const secret = forecastJobSecret();
	if (!secret) return json({ message: 'GM_FORECAST_JOB_SECRET is not set' }, 503);
	if (!authorised(request.headers.get('authorization'), secret)) return json({ message: 'Not authorised' }, 401);
	try {
		const report = await runForecastJob({ fetchForecast: carbonIntensity(), db: forecastJobDb(db()), systemNow });
		return json(report, 200);
	} catch (error) {
		console.error(`[forecast job] ${(error as Error).message}`);
		return json({ message: 'The forecast job failed; see the server log' }, 502);
	}
};

export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
