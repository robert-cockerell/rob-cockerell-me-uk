import { defineConfig, devices } from '@playwright/test';

// Browser tests for the charging planner (DEC-60, NFR-18). The config starts
// the dev servers. The stand-in serves LibreBooking and the demo clock on the
// same server, so GM_LIBREBOOKING_URL points back at it.
//
// The public demo (GM_PUBLIC_DEMO) has its own config, playwright.public-demo.config.ts:
// Astro runs one dev server per project at a time.
const PORT = 4321;
const ORIGIN = `http://localhost:${PORT}`;

const PUBLIC_DEMO_SPEC = /public-demo\.spec\.ts/;

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
	// The scenarios change shared data, and each file starts from its own reset.
	timeout: 60_000,
	projects: [
		// NFR-02 sizes: phones held upright, then tablets in landscape.
		{ name: 'phone-360x740', testIgnore: PUBLIC_DEMO_SPEC, use: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } },
		{ name: 'phone-390x844', testIgnore: PUBLIC_DEMO_SPEC, use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
		{ name: 'phone-430x932', testIgnore: PUBLIC_DEMO_SPEC, use: { viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true } },
		{ name: 'tablet-1024x768', testIgnore: PUBLIC_DEMO_SPEC, use: { viewport: { width: 1024, height: 768 } } },
		{ name: 'tablet-1366x1024', testIgnore: PUBLIC_DEMO_SPEC, use: { viewport: { width: 1366, height: 1024 } } },
	],
	webServer: {
		command: `npm run dev -- --port ${PORT}`,
		url: `${ORIGIN}/demos/charging-planner/stand-in/clock`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			GM_LIBREBOOKING_URL: `${ORIGIN}/demos/charging-planner/stand-in/api`,
			GM_DEMO_MODE: 'true',
			// AC-16.1: the proof of concept's handbook address (invented).
			GM_HANDBOOK_URL: 'https://docs.google.com/document/d/1RPkcPU35zs2kVmVeexJCgjuZUeO2-jFecB7i5H7U6nf/edit',
			GM_PUBLIC_DEMO: 'false',
		},
	},
});
