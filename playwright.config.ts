import { defineConfig, devices } from '@playwright/test';

// Browser tests for the charging planner (DEC-60, NFR-18). The config starts
// the dev server. The stand-in serves LibreBooking and the demo clock on the
// same server, so GM_LIBREBOOKING_URL points back at it.
const PORT = 4321;
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'e2e/planner',
	globalSetup: './e2e/planner/global-setup.ts',
	// The demo clock and fixtures are shared state: one test file at a time.
	workers: 1,
	fullyParallel: false,
	reporter: [['list']],
	use: {
		baseURL: ORIGIN,
		...devices['Desktop Chrome'],
	},
	projects: [
		// NFR-02 sizes. Stage 4 runs the phone size Rob compares with the reference page.
		{ name: 'phone-390x844', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
	],
	webServer: {
		command: `npm run dev -- --port ${PORT}`,
		url: `${ORIGIN}/demos/charging-planner/stand-in/clock`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			GM_LIBREBOOKING_URL: `${ORIGIN}/demos/charging-planner/stand-in/api`,
			GM_DEMO_MODE: 'true',
			GM_PUBLIC_DEMO: 'false',
		},
	},
});
