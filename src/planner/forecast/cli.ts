// npm run job:forecast — run process 1 once against the local server (DEC-60).
// pg_cron can't reach this machine, so in development this is how D1 gets
// live forecasts. Needs `npm run dev` running and GM_FORECAST_JOB_SECRET set.
// Another address can be given: npm run job:forecast -- <url>

const url = process.argv[2] ?? 'http://localhost:4321/demos/charging-planner/api/forecast-job';
const secret = process.env.GM_FORECAST_JOB_SECRET;

async function main(): Promise<number> {
	if (!secret) {
		console.error('Set GM_FORECAST_JOB_SECRET in .env first.');
		return 2;
	}
	let res: Response;
	try {
		res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' }, body: '{}' });
	} catch (error) {
		console.error(`Couldn't reach ${url}. Is npm run dev running? (${(error as Error).message})`);
		return 1;
	}
	console.log(`${res.status} ${await res.text()}`);
	return res.ok ? 0 : 1;
}

// Set the exit code rather than calling process.exit() straight after a fetch,
// which crashes Node 24 on Windows.
main().then((code) => {
	process.exitCode = code;
});
